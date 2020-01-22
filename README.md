# Express Boilerplate!
This is a boilerplate project used for starting new projects!

## Remove git histroy, install Dependencies, create .env (npmgit)
`rm -rf .git && git init`
`echo "node_modules" >> .gitignore`
`echo ".env" >> .gitignore`
`echo ".DS_Store" >> .gitignore;`
`npm install`
`touch .env`
`echo "NODE_ENV=development" > .env`
`echo "API_TOKEN=someAPIToken" >> .env`

# Edit `package.json`
Edit the contents of the `package.json` to update "name"

## Scripts
Start the application `npm start`
Start nodemon for the application `npm run dev`
Run the tests `npm test`

## Deploying
# Ensure project version of node and engine in `package.json`
    "engines": {
            "node": "12.6.0"
        }

`heroku create`
`npm test`
`npm run predeploy` ("npm audit")
`npm run deploy` ("git audit && git push heroku master")
`heroku open`