import React, { Component } from 'react';
import './App.css';
// import * as THREE from 'three';
import * as helpers from './util/helpers.js';
import FluxViewport from 'flux-viewport/dist/flux-viewport.common.js';
import $ from 'jquery';

import Button from './Button';
import Dropdown from './Dropdown';

import Projects from './Components/Projects';
import Slider from './Components/Slider';
import KeyList from './Components/KeyList';
import AddKey from './Components/AddKey';

const config = {
  url: window.location.href,
  flux_url: 'https://flux.io', // flux url
  flux_client_id: 'b99a9013-2742-4900-b52d-21ceb4b0b920' // your app's client id
}
const sphere = {"origin":[0,0,0],"primitive":"sphere","radius":5};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedIn: false,
      projects: [],
      keys: [],
      data: JSON.stringify(sphere),
      dataThree: '',
      image: ''
    };
    this.projectMap = {};
    this.keyMap = {};
    helpers.init(config).then((loggedIn) => {
      this.setState({loggedIn: loggedIn});
      if (loggedIn) {
        helpers.initCreate();
        helpers.getProjects().then((projects)=>{
          this.projectMap = {};
          for (let i=0;i<projects.entities.length;i++) {
            this.projectMap[projects.entities[i].id] = projects.entities[i];
          }
          this.setState({
            projects: projects.entities
          });
        });
      }
    });
  }

  handleSubmitKey(keyItem){
    // console.log(keyItem);
    // keyList.push(keyItem);
    // this.setState({keyList: keyList});
    // console.log(this.keyList);
    let createNewCell = this.createCell;
    let thisProject = this.project;
    let newlyMadeKey = this.keyItem;

    if(keyItem === '') {
      createNewCell.push(thisProject, newlyMadeKey);

    }
  }

  setViewport(div)
  {
    if (div == null || this.viewportDiv != null) return;
    this.viewportDiv = div;
    this.div = div;

    // Set up the FluxViewport in it's container
    var token = helpers.getFluxToken();
    this.vp = new FluxViewport(this.div, {projectId: this.project.id, token: token});
    var sphere = JSON.parse(this.state.data);
    this.updateViewport(sphere);
  }

  updateViewport(json) {
    var data = json;
    if (!FluxViewport.isKnownGeom(json)) {
      data = sphere;
    }

    this.vp.setGeometryEntity(data).then((result)=>{
      this.vp.focus();
      //this.vp._renderer._scene
      this.setState({dataThree: JSON.stringify(result.getObject())});
    });
  }
  _onLogin() {
      // don't need to updste state since page changes and state will refresh on load
      helpers.login();
  }

  _onLogout() {
      helpers.logout();
      this.setState({loggedIn: false});
  }

  _selectProject(sel) {
    this.project = this.projectMap[sel.value];
    helpers.getCells(this.project).then((cells)=>{
      this.keyMap = {};
      for (let i=0;i<cells.entities.length;i++) {
        this.keyMap[cells.entities[i].id] = cells.entities[i];
      }
      this.setState({
        keys: cells.entities.map((cell)=>{cell.name=cell.label; return cell;})
      });
    });
  }

  _stashValue() {
    if (this.value == null || this.value.constructor !== Array) return;
    this.entityMap = {};
    for (let i=0;i<this.value.length;i++) {
      var value = this.value[i];
      if (value == null || value.id == null) continue;
      this.entityMap[value.id] = value;
    }
  }

  _keyChange(sel){
    this.key = this.keyMap[sel.value];
    this.setState({
      "data": "Loading..."
    });
    helpers.getValue(this.project, this.key).then((cell)=>{
      this.value = cell.value;
      this.updateViewport(this.value);
      this.setState({
        "data": JSON.stringify(this.value)
      });
    });
  }



  _getOptions() {
    if (this.state.loggedIn) {
      return (<div className="options">
        <Button label="Logout" callback={()=>{this._onLogout()}}></Button>
        <Dropdown hint="select project" callback={(e)=>{this._selectProject(e.currentTarget)}} items={this.state.projects}></Dropdown>
        <Dropdown hint="select key" callback={(e)=>{this._keyChange(e.currentTarget)}} items={this.state.keys}></Dropdown>
      </div>);
    } else {
      return (
        <div className="options">
          <Button label="Login" callback={()=>{this._onLogin()}}></Button>
        </div>);
    }
  }

  _getContent() {
    if (this.project != null) {
      return (
        <div className="content">
          <div className="viewport" ref={this.setViewport.bind(this)}></div>
        </div>
        );
    } else {
      return <div className="content"></div>
    }
  }
  // Function to update react state to match what is in the text box
  // Prevents clobbering of user input by react
  _handleDataChange(e) {
    this.setState({data: e.target.value});
  }

  render() {
    // console.log(this.state.projects);
    console.log(this.state.keys);

    return (
      <div className="App">
          {this._getOptions()}
          {this._getContent()}
          <div className="info">
            <Projects projects={this.state.projects} />
            <KeyList test="Hello World" keyList={this.state.keys} />
            <AddKey addKey={this.handleSubmitKey.bind(this)}/> <br />
            <Slider className="slider" />

          </div>
      </div>
    );
  }
}

export default App;