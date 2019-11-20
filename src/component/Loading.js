import React, {PureComponent} from 'react';
import {ActivityIndicator, StyleSheet, Text, View, ViewPropTypes} from 'react-native';

import PropTypes from 'prop-types';

import globalStyles from "../common/globalStyles";


/**
 * Loading indicator. On light mode, it won't dim the background.
 */
class Loading extends PureComponent {

  static propTypes = {
    show: PropTypes.bool.isRequired,
    title: PropTypes.string,
    lightMode: PropTypes.bool,
    style: ViewPropTypes.style,
  };

  static defaultProps = {
    show: false,
    title: '',
    lightMode: false,
  };

  render() {
    return <View style={styles.position}>
      <View style={[styles.container, this.props.style].concat(
        this.props.show ? null : globalStyles.hide,
        this.props.lightMode && {backgroundColor: 'transparent'})}>

        <View style={styles.content}>
          <ActivityIndicator size='large' color='#fff' style={styles.activityIndicator}/>
          {
            this.props.title ? <Text style={styles.title}>{this.props.title}</Text> : null
          }
        </View>

      </View>
    </View>;
  }
}

const styles = StyleSheet.create({
  position: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 20
  },

  activityIndicator: {},
  title: {
    color: '#fff',
    textAlign: 'center'
  },
});

export default Loading;