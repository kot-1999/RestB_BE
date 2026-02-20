import {
    S3Client,
    CreateBucketCommand,
    HeadBucketCommand
} from '@aws-sdk/client-s3'
import config from 'config';

import logger from './Logger';
import { IConfig } from '../types/config';

class AwsS3 {
    private s3
    private bucketName = 'restaurant-images'

    constructor(s3Config: IConfig['s3']) {
        this.s3 = new S3Client(s3Config)
    }

    public async init() {
        await this.ensureBucketExists()
    }

    private async ensureBucketExists() {
        try {
            await this.s3.send(new HeadBucketCommand({ Bucket: this.bucketName }))
        } catch {
            await this.s3.send(new CreateBucketCommand({ Bucket: this.bucketName }))
        }
    }
}

const s3Config = config.get<IConfig['s3']>('s3')
const s3Service = new AwsS3(s3Config)

s3Service.init()
    .then(() =>  logger.info('S3 bucket was initialized'))
    .catch((err) => logger.error('S3 bucket initialization failed: ' + err.message))

export default s3Service