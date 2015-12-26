const ReactDOM = require('react-dom');
import * as React from 'react';
import ApplicationComponent from './1_ApplicationComponent';

$(() => {
    ReactDOM.render(React.createElement(ApplicationComponent), document.getElementById('black-screen'));
});
