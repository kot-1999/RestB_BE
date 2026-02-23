import { randomUUID } from 'crypto'

import {
    S3Client,
    CreateBucketCommand,
    HeadBucketCommand, PutObjectCommand, GetObjectCommand, PutBucketCorsCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from 'config';

import logger from './Logger';
import { IConfig } from '../types/config';

class AwsS3 {
    private s3
    // TODO: For production usage, remove s3FroPresign and keep only s3.
    // NOTE: It is used to make images available outside of docker container
    private s3ForPresign

    private bucketName = 'rest-images'
    private s3Config
    
    constructor(s3Config: IConfig['s3']) {
        this.s3Config = s3Config;

        this.s3 = new S3Client(this.s3Config)

        this.s3ForPresign = new S3Client({
            ...this.s3Config,
            endpoint: this.s3Config.endpoint.replace('rustfs_dev', 'localhost')
        })
    }

    public async init() {
        await this.ensureBucketExists()

        // Update cors policy for the bucket
        const command = new PutBucketCorsCommand({
            Bucket: this.bucketName,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedOrigins: ['*'],
                        AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
                        AllowedHeaders: ['*'],
                        ExposeHeaders: ['ETag']
                    }
                ]
            }
        })

        await this.s3.send(command)
    }

    private async ensureBucketExists() {
        try {
            await this.s3.send(new HeadBucketCommand({ Bucket: this.bucketName }))
        } catch {
            await this.s3.send(new CreateBucketCommand({ Bucket: this.bucketName }))
        }
    }

    public async getUploadUrl(filename: string, contentType: string) {
        const key = `restaurants/${randomUUID()}-${filename}`

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: contentType,
            ACL: 'public-read'  // make the object publicly readable
        })

        const uploadUrl = await getSignedUrl(this.s3ForPresign, command)

        // Generate presigned GET URL for frontend
        const publicUrl = await this.getPublicUrl(key)

        return {
            uploadUrl,
            key,
            publicUrl  // frontend can use this to display the image
        }
    }

    public async getPublicUrl(key: string) {
        return `${this.s3Config.endpoint.replace('rustfs_dev', 'localhost')}/${this.bucketName}/${key}`
    }
}

const s3Config = config.get<IConfig['s3']>('s3')
const s3Service = new AwsS3(s3Config)

s3Service.init()
    .then(() =>  logger.info('S3 bucket was initialized'))
    .catch((err) => logger.error('S3 bucket initialization failed: ', err))

export default s3Service