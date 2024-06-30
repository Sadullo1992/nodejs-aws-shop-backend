import { Readable } from 'node:stream';
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import * as csv from "csv-parser";

const s3Client = new S3Client({});

exports.handler = async (event: S3Event): Promise<any> => {

    event.Records.forEach(record => console.log(record.s3.object.key))

    const bucketName = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;

    const cmd = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
    })

    try {
        const response = await s3Client.send(cmd);

        const readableStream = response.Body as Readable;

        readableStream.pipe(csv()).on('data', function(data) {
            console.log(data)
        }).on('end', () => {
            console.log('Parsing is ended!!')
        });
        

    } catch (e) {
        console.log('ERROR', e)
    }
};
