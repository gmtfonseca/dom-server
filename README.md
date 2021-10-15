# Dom Server

AWS SAM Application designed to send user tailored emails.

## Services used
* AWS API Gateway
* AWS Lambda
* AWS SES
* AWS SSM Parameter Store
* AWS KMS
* Google reCAPTCHA v3

## Architecture overview
![Architecture image](docs/architecture.png)

## Built with

* [Node.js](https://nodejs.org/en/) - JavaScript runtime
* [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
* [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html) - Version 3 of the AWS SDK for JavaScript
* [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/index.html) - Open-source framework to build serverless applications on AWS


## Run local API for development
```
$ npm run serve
```

## Build for production
```
$ npm run build
```

## Deploy to AWS
```
$ npm run deploy
```

## Run unit tests
```
$ npm test
```
