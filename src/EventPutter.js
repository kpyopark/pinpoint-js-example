import React from 'react';
import AWS from 'aws-sdk';
import * as DD from 'react-device-detect';

const { PinpointClient, PutEventsCommand } = require("@aws-sdk/client-pinpoint");

const IDENTITY_POOL_ID = '<your identity pool id>';
const PINPOINT_APP_ID = '<your pinpoint app id>';
const REGION = "<your pintpoint / cognito endpoint region>";

class EventPuter extends React.Component {

  constructor(props) {
    super(props);
    this.pinpointClient = null;
    this.getCognitoId();
  }

  getCognitoId() {
    AWS.config.region = REGION; 
    var cognitoidentity = new AWS.CognitoIdentity();
    var params = {
      IdentityPoolId: IDENTITY_POOL_ID
    };
    new Promise((resolve, reject) => {
      cognitoidentity
      .getId(params, (err, data) => {
        if(err)
          reject(err);
        else
          resolve(data);
      })
    })
    .then((data) => {
      const param = {
        IdentityId: data.IdentityId
      };
      return new Promise((resolve, reject) => {
        cognitoidentity.getCredentialsForIdentity(param, (err,data) => {
          if(err)
            reject(err);
          else
            resolve(data);
        });
      });
    })
    .then((data) => {
      this.pinpointClient = new PinpointClient({
        region: REGION,
        credentials : {
          secretAccessKey : data.Credentials.SecretKey,
          accessKeyId: data.Credentials.AccessKeyId,
          sessionToken: data.Credentials.SessionToken
        }
      });
      console.log(data.Credentials);
    })
    .catch((err) => {
      console.log(err, err.stack); // an error occurred
    });
  }

  putEvent() {
    // orginal template from 
    // revisied template from https://stackoverflow.com/questions/58016566/amazon-pinpoint-endpoints-in-putevents-method-of-the-javascript-sdk-arent-worki
    var params = {
      ApplicationId: PINPOINT_APP_ID, /* required */
      EventsRequest: {
        BatchItem: { }
      }
    };
    var eventParam = {
      Endpoint: {
        Address: "Sample",
        ChannelType: 'CUSTOM',
        Demographic: {
            AppVersion: "app_version",
            Locale: "locale",
            Make: "NA",
            Model: "NA",
            ModelVersion: "NA",
            Platform: DD.osName,
            PlatformVersion: DD.osVersion
        },
        User: {
          UserId : "SampleUser"
        }
      }
    };
    eventParam['Events'] = [{
      EventType: "TEST_EVENT",
      Timestamp: (new Date()).toISOString()
    }];
    var endpointId = eventParam.Endpoint.User.UserId+'CUSTOM'
    params.EventsRequest.BatchItem[endpointId] = eventParam;
    var command = new PutEventsCommand(params);
    this.pinpointClient
      .send(command)
      .then((fullfilled) => {
        console.log(fullfilled);
      })
      .catch((error) => {
        console.log(error);
      });
    console.log("put event.");
  }

  render() {
    return (
      <button onClick={() => this.putEvent()}
      >
                  Put Event
      </button>
    );
  }
}

export default EventPuter;