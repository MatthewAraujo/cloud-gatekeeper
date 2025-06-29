import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IAMClient, PutUserPolicyCommand, ListUsersCommand, GetUserCommand, CreateUserCommand, NoSuchEntityException } from '@aws-sdk/client-iam'
import { ResourceGroupsTaggingAPIClient, GetResourcesCommand } from '@aws-sdk/client-resource-groups-tagging-api'

interface ProjectAccessRequest {
  username: string
  project: string
  permissions: string[]
  resource?: string
}

interface DiscoveredResource {
  arn: string
  type: string
  name: string
}

@Injectable()
export class AwsService {
  private iamClient: IAMClient
  private resourceGroupsClient: ResourceGroupsTaggingAPIClient

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID')
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY')
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1')

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials are required. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.')
    }

    const credentials = {
      accessKeyId,
      secretAccessKey,
    }

    this.iamClient = new IAMClient({
      region,
      credentials,
    })

    this.resourceGroupsClient = new ResourceGroupsTaggingAPIClient({
      region,
      credentials,
    })
  }
  async grantAccess(
    username: string,
    resource: string,
    permissions: string[]
  ): Promise<void> {
    try {
      const policyDocument = this.createPolicyDocument(resource, permissions)

      await this.putUserPolicy(username, resource, policyDocument)

      console.log(`Successfully granted access for user ${username} to ${resource}`)
    } catch (error) {
      console.error(`Failed to grant access for user ${username}:`, error)
      // Re-throw the error to let the caller handle it appropriately
      throw error
    }
  }

  async grantProjectAccess(request: ProjectAccessRequest): Promise<void> {
    const { username, project, permissions, resource } = request

    // Check if the IAM user exists before attempting to grant access
    const userExists = await this.checkUserExists(username)
    if (!userExists) {
      throw new Error(`IAM user '${username}' does not exist in AWS. Please create the user in AWS IAM before approving access requests.`)
    }

    // Use provided resource or discover from project
    const targetResource = resource || await this.discoverResourceByProject(project)

    // Grant access
    await this.grantAccess(username, targetResource, permissions)
  }

  private async discoverResourceByProject(projectName: string): Promise<string> {
    try {
      console.log(`🔍 Discovering resources for project: ${projectName}`)

      // Search for resources with the project name in tags or resource name
      const response = await this.resourceGroupsClient.send(new GetResourcesCommand({
        TagFilters: [
          {
            Key: 'Project',
            Values: [projectName]
          }
        ]
      }))

      if (response.ResourceTagMappingList && response.ResourceTagMappingList.length > 0) {
        const resource = response.ResourceTagMappingList[0]
        const arn = resource.ResourceARN
        if (arn) {
          console.log(`✅ Found resource by tag: ${arn}`)
          return `${arn}/*`
        }
      }

      // If no tagged resources found, try searching by resource name
      const resourcesByName = await this.searchResourcesByName(projectName)
      if (resourcesByName.length > 0) {
        const resource = resourcesByName[0]
        console.log(`✅ Found resource by name: ${resource.arn}`)
        return `${resource.arn}/*`
      }

      // No resources found - use a fallback ARN pattern instead of throwing
      console.warn(`⚠️ No AWS resources found for project: ${projectName}. Using fallback ARN pattern.`)
      return `arn:aws:s3:::${projectName}/*`
    } catch (error) {
      console.error(`❌ Error discovering resources for project ${projectName}:`, error)
      // Use fallback ARN pattern instead of throwing to prevent API crashes
      console.warn(`⚠️ Using fallback ARN pattern for project: ${projectName}`)
      return `arn:aws:s3:::${projectName}/*`
    }
  }

  private async searchResourcesByName(projectName: string): Promise<DiscoveredResource[]> {
    const resources: DiscoveredResource[] = []

    try {
      // Search for resources that might contain the project name
      // Use correct ResourceTypeFilters format for AWS Resource Groups Tagging API
      const response = await this.resourceGroupsClient.send(new GetResourcesCommand({
        ResourceTypeFilters: [
          's3',
          'lambda',
          'ec2',
          'rds',
          'dynamodb'
        ]
      }))

      if (response.ResourceTagMappingList) {
        for (const resourceMapping of response.ResourceTagMappingList) {
          const arn = resourceMapping.ResourceARN
          if (arn) {
            const resourceName = this.extractResourceNameFromArn(arn)

            // Check if the resource name contains the project name
            if (resourceName.toLowerCase().includes(projectName.toLowerCase())) {
              resources.push({
                arn,
                type: this.extractResourceTypeFromArn(arn),
                name: resourceName
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Error searching resources by name:', error)
      // Don't throw the error, just return empty array to allow fallback
    }

    return resources
  }

  private extractResourceNameFromArn(arn: string): string {
    // Extract resource name from ARN
    // Example: arn:aws:s3:::my-bucket -> my-bucket
    const parts = arn.split(':')
    if (parts.length >= 6) {
      return parts[5]
    }
    return arn
  }

  private extractResourceTypeFromArn(arn: string): string {
    // Extract resource type from ARN
    // Example: arn:aws:s3:::my-bucket -> s3
    const parts = arn.split(':')
    if (parts.length >= 3) {
      return parts[2]
    }
    return 'unknown'
  }

  private createPolicyDocument(resource: string, permissions: string[]): string {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: permissions,
          Resource: resource,
        },
      ],
    }

    return JSON.stringify(policy)
  }

  private async putUserPolicy(
    username: string,
    resource: string,
    policyDocument: string
  ): Promise<void> {
    try {
      const policyName = `CloudGatekeeper-${resource.replace(/[^a-zA-Z0-9]/g, '-')}`

      await this.iamClient.send(
        new PutUserPolicyCommand({
          UserName: username,
          PolicyName: policyName,
          PolicyDocument: policyDocument,
        })
      )

      console.log(`Applied policy ${policyName} to user ${username}`)
    } catch (error) {
      if (error instanceof NoSuchEntityException) {
        console.error(`❌ IAM user '${username}' does not exist in AWS. Cannot apply policy.`)
        console.error('💡 To fix this issue:')
        console.error('   1. Create the IAM user in AWS IAM')
        console.error('   2. Or ensure the username in the access request matches an existing IAM user')
        console.error('   3. Or implement automatic IAM user creation (requires additional AWS permissions)')
        throw new Error(`IAM user '${username}' does not exist. Please create the user in AWS IAM first.`)
      }

      console.error(`Failed to apply policy to user ${username}:`, error)
      throw error // Re-throw for the calling method to handle
    }
  }

  // Optional: Method to create IAM user if it doesn't exist
  // This requires additional AWS permissions (iam:CreateUser)
  private async ensureUserExists(username: string): Promise<void> {
    try {
      // Try to get the user to see if it exists
      await this.iamClient.send(new GetUserCommand({ UserName: username }))
      console.log(`✅ IAM user '${username}' already exists`)
    } catch (error) {
      if (error instanceof NoSuchEntityException) {
        console.log(`🔄 Creating IAM user '${username}'...`)
        try {
          await this.iamClient.send(new CreateUserCommand({ UserName: username }))
          console.log(`✅ Successfully created IAM user '${username}'`)
        } catch (createError) {
          console.error(`❌ Failed to create IAM user '${username}':`, createError)
          throw new Error(`Cannot create IAM user '${username}'. Insufficient permissions or user already exists.`)
        }
      } else {
        throw error
      }
    }
  }

  // Check if an IAM user exists
  private async checkUserExists(username: string): Promise<boolean> {
    try {
      await this.iamClient.send(new GetUserCommand({ UserName: username }))
      return true
    } catch (error) {
      if (error instanceof NoSuchEntityException) {
        return false
      }
      // For other errors, re-throw to avoid masking real issues
      throw error
    }
  }

  // List existing IAM users (for debugging)
  async listUsers(): Promise<string[]> {
    try {
      const response = await this.iamClient.send(new ListUsersCommand({}))
      return response.Users?.map(user => user.UserName).filter(Boolean) as string[] || []
    } catch (error) {
      console.error('Failed to list IAM users:', error)
      throw error
    }
  }
} 