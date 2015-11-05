const ReactDOM = require('react-dom');
import * as React from 'react';
import ApplicationComponent from './ApplicationComponent';

$(() => {
    ReactDOM.render(React.createElement(ApplicationComponent), document.getElementById('black-screen'));
});
