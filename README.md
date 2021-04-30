# Repo Title REPLACE
<a href="http://dev.bandwidth.com"><img src="https://s3.amazonaws.com/bwdemos/BW-VMP.png"/></a>

 # Table of Contents

<!-- TOC -->

* [Repo Title REPLACE](#repo-title-replace)
* [Description](#description)
* [Pre-Requisites](#pre-requisites)
* [Environmental Variables](#environmental-variables)
* [Callback URLs](#callback-urls)
* [Running the Application](#running-the-application)
  * [Run](#run)
  * [Ngrok](#ngrok)

<!-- /TOC -->

# Description

A short description of your sample app and its capabilities.

# Pre-Requisites

In order to use the Bandwidth API, users need to set up the appropriate application in their [Bandwidth Dashboard](https://dashboard.bandwidth.com/) and create [API credentials](https://dev.bandwidth.com/guides/accountCredentials.html#top).

To create an application, log into the [Bandwidth Dashboard](https://dashboard.bandwidth.com/) and navigate to the `Applications` tab.  Fill out the **New Application** form, selecting the service (Messaging or Voice) that the application will be used for.  All Bandwidth services require publicly accessible Callback URLs. For more information on how to set one up see [Callback URLs](#callback-urls).

For more information about API credentials see [here](https://dev.bandwidth.com/guides/accountCredentials.html#top).

# Environmental Variables

The sample app uses the below environmental variables.
```sh
BW_ACCOUNT_ID                        # Your Bandwidth Account Id
BW_USERNAME                          # Your Bandwidth API Username
BW_PASSWORD                          # Your Bandwidth API Password
BW_VOICE_APPLICATION_ID              # Your Voice Application Id created in the dashboard
BW_MESSAGING_APPLICATION_ID          # Your Messaging Application Id created in the dashboard
BW_NUMBER                            # The Bandwidth phone number involved with this application
USER_NUMBER                          # The user's phone number involved with this application
BASE_CALLBACK_URL                    # Your public base url to receive Bandwidth Webhooks. No trailing '/'
LOCAL_PORT                           # The port number you wish to run the sample on
```

# Callback URLs

For a detailed introduction to Bandwidth Callbacks see https://dev.bandwidth.com/guides/callbacks/callbacks.html

Below are the callback paths:
* `/callbacks/inbound/voice`
* `/callbacks/outbound/messaging`
* `<add other callbacks>`
* **Should follow ``/callbacks/{direction}/{service}` conventions**

# Running the Application
## Run
Use the following commands to run the application:

```sh
npm install
npm start
```

## Ngrok

A simple way to set up a local callback URL for testing is to use the free tool [ngrok](https://ngrok.com/).  
After you have downloaded and installed `ngrok` run the following command to open a public tunnel to your port (`$PORT`)
```sh
ngrok http $PORT
```
You can view your public URL at `http://127.0.0.1:{PORT}` after ngrok is running.  You can also view the status of the tunnel and requests/responses here.
