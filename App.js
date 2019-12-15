import React, {Component} from 'react';
import {Alert, Dimensions, Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {AudioRecorder, AudioUtils} from 'react-native-audio';
import RNFetchBlob from 'rn-fetch-blob';
import * as queryString from 'query-string';

import request from "./src/util/request";
import config from "./src/common/config";
import strings from "./src/common/strings";
import Loading from "./src/component/Loading";
import ErrorCodeASR from "./src/util/ErrorCodeASR";


/**
 * Please fill in your own API key and Secret key.
 * The following AK and SK may expire at any time.
 * */
const API_KEY = 'bKqA9Y7p6GYZHNFUvRPWK62R';
const SECRET_KEY = 'A0NoHpfDIwtmF5SlbHl4dGUvoaFs6Lzx';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      recording: false,
      recognizing: false,
      result: '',
    };
  }

  render() {
    return (
      <View style={styles.container}>
        <StatusBar StatusBarStyle="light-content"/>

        <Text style={styles.title}>{'百度语音识别 Demo'}</Text>
        <Text style={styles.subtitle}>{'长按按钮开始录音，松开后开始识别'}</Text>

        <TouchableOpacity onPress={() => this.onPress()}
                          onLongPress={() => this.startRecording()}
                          onPressOut={() => this.finishRecording()}>
          <View style={[styles.startButton]}>
            <Image style={styles.imgMic} resizeMode={'contain'}
                   source={require('./src/asset/ic_mic.png')}/>
          </View>
        </TouchableOpacity>

        <Text style={styles.resultLabel}>{'识别结果：'}</Text>
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{this.state.result.length && this.state.result[0] || ''}</Text>
        </View>

        <Loading show={this.state.recognizing} lightMode={true}/>

        <Loading show={this.state.recording} title={'Please speaking...'}/>
      </View>
    );
  }

  componentDidMount() {
    AudioRecorder.requestAuthorization().then((isAuthorised) => {
      if (!isAuthorised) {
        console.warn('recording permission denied!')
      }
    });
  }

  componentWillUnmount() {
    this.timeout && clearTimeout(this.timeout);
  }

  onPress() {
    Alert.alert('长按按钮开始录音，松开后开始识别', '', [{text: '好的'}]);
  }

  startRecording() {
    AudioRecorder.checkAuthorizationStatus().then(result => {
      // on android result is bool, on iOS result is string
      if ((Platform.OS === 'android' && result) || result === 'granted') {
        this._prepareAndStart();
      } else {
        AudioRecorder.requestAuthorization().then((isAuthorised) => {
          if (isAuthorised) {
            this._prepareAndStart();
            // the length of a recording file should be shorter than one minutes
            this.timeout = setTimeout(() => this.finishRecording(), 10 * 1000 /*60 * 1000*/);
          } else {
            Alert.alert('未获得麦克风授权！', '', [{text: '确认'}]);
            if (__DEV__) {
              console.warn('Can\'t start recording, permission not granted!');
            }
          }
        });
      }
    });
  }

  async _prepareAndStart() {
    if (this.state.recording) {
      if (__DEV__) {
        console.warn('Already recording!');
      }
      return;
    }

    AudioRecorder.prepareRecordingAtPath(AUDIO_PATH, {
      Channels: 1,
      SampleRate: 16000,
      AudioEncoding: Platform.OS === 'android' ? 'amr_wb' : 'lpcm',
      ...Platform.select({
        ios: {
          AudioQuality: 'Medium',
        },
        android: {
          OutputFormat: 'amr_wb',
          AudioEncodingBitRate: 48000,
          // AudioSource: AudioRecorder.MIC,
        }
      }),
    });

    // callback for iOS
    /*
    AudioRecorder.onProgress = (data) => {
      console.log('App-onProgress(): ' + data.currentTime);
    };

    AudioRecorder.onFinished = (data) => {
      if (Platform.OS === 'ios') {
        console.log('App-onFinished(): ' + data.audioFileURL + data.audioFileSize);
      }
    };
    */

    try {
      await AudioRecorder.startRecording();
      this.setState({recording: true});
    } catch (error) {
      console.error(error);
    }
  }

  async finishRecording() {
    if (!this.state.recording) {
      return;
    }

    try {
      await AudioRecorder.stopRecording();
      this._startRecognizing();
    } catch (error) {
      console.error(error);
    }
  }

  async _startRecognizing() {
    this.setState({recording: false, recognizing: true});

    const auth = await Promise.race([
      request.get(
        config.api.baiduAuth,
        {
          grant_type: 'client_credentials',
          client_id: API_KEY,
          client_secret: SECRET_KEY,
        }
      ),
      new Promise(resolve => {
        setTimeout(() => resolve({status: 1, message: strings.network.network_timeout}), 5000)
      })
    ]);

    if (!auth.status) {
      let vopUrl = config.api.vopAPI += '?' + queryString.stringify(
        {
          cuid: 'demo_user',
          token: auth.access_token,
          dev_pid: 1536,
        }
      );

      RNFetchBlob
        .fetch('POST', vopUrl,
          {'Content-Type': `audio/${AUDIO_FORMAT};rate=16000`},
          RNFetchBlob.wrap(AUDIO_PATH),
        ).then((res) => {
        // result is an array, usually the most accurate one first
        if (__DEV__) {
          console.log('识别结果：' + res.text());
        }

        res = res.json();
        if (res.err_no && res.err_no > 0) {
          Alert.alert('识别失败', ErrorCodeASR[res.err_no], [{text: '确认'}]);
        } else {
          this._handleResult(res.result);
        }
        this._recognizeEnd();
      }).catch((err) => {
        if (__DEV__) {
          console.warn(`App-_startRecognizing(): ${JSON.stringify(err)}`);
        }
        this._recognizeEnd();
      });
    } else {
      if (auth.message) {
        Alert.alert(auth.message, '', [{text: '确认'}]);
      } else {
        Alert.alert('请求出错，请稍后再试！', '', [{text: '确认'}]);
      }
      this._recognizeEnd();
    }
  }

  _recognizeEnd() {
    this.setState({recognizing: false});
  }

  _handleResult(result) {
      this.setState({result})
  }
}

const AUDIO_PATH = AudioUtils.DocumentDirectoryPath + (Platform.OS === 'android' ? '/reg.amr' : '/reg.pcm');
const AUDIO_FORMAT = Platform.OS === 'android' ? 'amr' : 'pcm';

const {width, height} = Dimensions.get('window');
const startBtnSize = width * 0.3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#333',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 50,
  },
  subtitle: {
    color: '#de3f17',
    fontSize: 15,
    marginTop: 10,
    marginBottom: 30,
  },

  startButton: {
    width: startBtnSize,
    height: startBtnSize,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fcd50a',
    borderRadius: startBtnSize / 2,
    ...Platform.select({
      ios: {
        overflow: 'visible',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 5,
      }
    }),
  },
  imgMic: {
    width: 80,
    height: 80,
  },
  recordingText: {
    color: 'red',
    fontSize: 18,
  },

  resultLabel: {
    width: width - 40,
    color: '#333',
    fontSize: 16,
    marginTop: 30,
    marginBottom: 4,
  },
  resultContainer: {
    width: width - 40,
    height: 200,
    backgroundColor: '#ccc',
    marginHorizontal: 20,
    padding: 10,
  },
  resultText: {
    flex: 1,
    color: '#555',
    fontSize: 14,
  },

});

export default App;
