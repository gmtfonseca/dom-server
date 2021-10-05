npm run build
cp -f package.json dist/package.json
sam build
sam deploy