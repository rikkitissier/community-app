# Installing the mobile app for development

These are the instructions for installing the dev environment needed to run the mobile app for development. In addition, you'll need to set up your IPS4 install for use with the app. There's a readme in the `IPS4-Tools/graphql-browser` repo that covers that and installing a web app to play with the API.

### Step 1

Install Node & NPM: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm

### Step 2

Create an expo.io account: https://expo.io/signup

### Step 3

Install the expo CLI: https://docs.expo.io/versions/v32.0.0/introduction/installation/. These are the dev tools that compile the app during development, hot-reload on file changes, etc.

### Step 4

Install the Expo app on your phone if you want to run the mobile app on a real device. Alternatively (or as well as), install xCode so that you can use the iOS simulator.

### Step 5

In terminal, switch to the invision-community-app repo, and type `npm install`.

### Step 6

If everything went well, open the `app.json` file and change the values:

- `oauth_client_id`: An oAuth key you set up in IPS4. Follow the readme in _IPS4-Tools/graphql-browser_ - it's the same idea.
- `api_url`: The URL to your IPS4 install. Slash at the end, don't include /api/.

### Step 6

Type `npm start` to launch the expo dev environment. It should open in your web browser. From here, you can either scan the QR code with your phone to open it, or run it in the simulator by selecting "Run on iOS simulator" inside the dev tools.

### Step 7

If you're running on the simulator, it should prompt to install the Expo app in the simulator automatically, and then open it
