const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

// Region is automatically picked up from your env (AWS_REGION)
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

module.exports = { dynamodb };
