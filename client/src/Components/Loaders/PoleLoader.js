// Credit: https://codepen.io/bphillips201/pen/npMYNx

import React from 'react';
import './PoleLoader.scss';

const PoleLoader = () => {
  return (
    <div className="custom-pole">
      <div className="custom-head"></div>
      <div className="custom-head-base"></div>
      <div className="custom-loader-head"></div>
      <div className="custom-loader">
        <div className="custom-inset">
          <div className="custom-red"></div>
          <div className="custom-blue"></div>
          <div className="custom-red"></div>
          <div className="custom-blue"></div>
          <div className="custom-red"></div>
          <div className="custom-blue"></div>
        </div>
      </div>
      <div className="custom-loader-base"></div>
      <div className="custom-base"></div>
    </div>
  );
};

export default PoleLoader;
