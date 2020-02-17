import React from 'react';
import logo from './logo.svg';
import './App.css';
import './boot.css'
import $ from 'jquery';
import { shallowEqual } from '@babel/types';
import ComplexDonut from './components/strippedChart';
import Donut from './components/chart';
import VelocityChart from './components/velocityChart'

class BackTrack extends React.Component {
  constructor(props) {
    super(props);
    this.handleLoginClick = this.handleLoginClick.bind(this);
    this.handleUserNameChange = this.handleUserNameChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleSignUpClick = this.handleSignUpClick.bind(this);
    this.handleBackToLogin = this.handleBackToLogin.bind(this);
    this.handleBackToSignUp = this.handleBackToSignUp.bind(this);
    this.roleChange = this.roleChange.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.state = {
      isLoggedIn: localStorage.getItem('token')!==null ? true : false,
      UserName: "",
      Password: "",
      Name:"",
      Email:"",
      role:"Developer",
      authError: false,
      isCreateAccount: false,
      ws: null
    };
    
  }


  componentDidMount() {
   this.loadUserDetails();
   

  }  


  
  loadUserDetails(){
    if(this.state.isLoggedIn){
      fetch('http://localhost:8000/authentication/current_user/', {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(json => {
          console.log(json)
          if(json.username){
            console.log("Inside user details");
            console.log(json)
            this.setState({ 
              Name: json.username
            });
          }
          else{
            console.log("Expired!");
            this.setState({ 
              isLoggedIn: false
            });
          }
        });
    }
  }

  checkLogin() {
    fetch('http://localhost:8000/token-auth/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({username: this.state.UserName, password: this.state.Password})
    })
      .then(res => res.json())
      .then(json => {
        if(json.token){
          console.log(json);
          localStorage.setItem('token', json.token);
          this.setState({
            isLoggedIn: true,
            Name: json.user.username
          });
        }
        else{
          this.setState({
            authError: true,
            isLoggedIn: false
          });
        }
      });
    
  }


  handleUserNameChange(username) {
    this.setState({
      UserName: username
    });
    
  }
  
  roleChange(userRole) {
    this.setState({
      role: userRole
    });
    console.log(this.state.role)
  }

  handleEmailChange(email) {
    this.setState({
      Email: email
    });
  }

  handlePasswordChange(password) {
    this.setState({
      Password: password
    });
  }


  handleLoginClick(e) {
    e.preventDefault(e);
    this.checkLogin();
    
  }

  handleLogout(e) {
    e.preventDefault(e);
    localStorage.removeItem('token');
    this.setState({ isLoggedIn: false, isCreateAccount: false, UserName: "", Password: "", authError: "" });
  }

  handleBackToLogin(e) {
    e.preventDefault(e);
    this.setState({ isLoggedIn: false, isCreateAccount: false});
  }

  handleBackToSignUp(e) {
    e.preventDefault(e);
    this.setState({ isLoggedIn: false, isCreateAccount: true});
  }


  handleSignUpClick(e){
    e.preventDefault(e);
    fetch('http://localhost:8000/authentication/users/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({username:this.state.UserName, password:this.state.Password, email:this.state.Email, role:this.state.role})
    })
      .then(res => res.json())
      .then(json => {
        console.log(json);
        localStorage.setItem('token', json.token);
        this.setState({
          isLoggedIn: true,
          isCreateAccount: false,
          Name: json.username,
          role: "Developer"//for a user that signup next
        });
      });
  }

  render() {
    console.log("render")
    console.log(this.state.UserName);
    console.log(this.state.Name)
    let view = null;
    if (this.state.isLoggedIn) {
     view = <LoggedInState
      handleLogout={this.handleLogout}
      Name={this.state.Name}
      ws={this.state.ws}
    />;
    } 
    else if(this.state.isCreateAccount){
      view = <CreateAccountState
        userName={this.state.UserName}
        password={this.state.Password}
        onUserNameChange={this.handleUserNameChange}
        onEmailChange={this.handleEmailChange}
        onPasswordChange={this.handlePasswordChange}
        onSignUpClick={this.handleSignUpClick}
        onBackToLogin={this.handleBackToLogin}
        onroleChange={this.roleChange}
        role={this.state.role}
      />;
    }else {
      view = <LoggedOutState
        userName={this.state.UserName}
        password={this.state.Password}
        onUserNameChange={this.handleUserNameChange}
        onPasswordChange={this.handlePasswordChange}
        onLoginClick={this.handleLoginClick}
        authError={this.state.authError}
        onBackToSignUp={this.handleBackToSignUp}
      />;
    }
    return (
      <div>
      {view}
      </div>
    );
  }
} 

class LoggedInState extends React.Component {
  constructor(props) {
     super(props);
      //bind this to functions
      this.handleLogout = this.handleLogout.bind(this);
      this.createProject = this.createProject.bind(this);
      this.deleteProject = this.deleteProject.bind(this);
      this.getProductOwnerName = this.getProductOwnerName.bind(this);
      this.shiftTab = this.shiftTab.bind(this);
      this.checkIfScrum = this.checkIfScrum.bind(this);
      this.handleSelected = this.handleSelected.bind(this);
      this.checkIfPO = this.checkIfPO.bind(this);
      this.state = {
        ProjectsView:false,
        Projects:[],
        ProductOwnerName:"",
        currentTab: "productBacklog",
        ws: null,
        isScrumMaster:false,
        productSelected:0,
        isProductOwner:false
      };
  }

componentDidMount() {
    // await this.checkIfScrum();
    this.getProjects();
    this.connect();
  } 



  timeout = 250; // Initial timeout duration as a class variable

    /**
     * @function connect
     * This function establishes the connect with the websocket and also ensures constant reconnection if connection closes
     */
    connect = () => {
        var ws = new WebSocket("ws://127.0.0.1:8000");
        let that = this; // cache the this
        var connectInterval;
        console.log(ws);

        // websocket onopen event listener
        ws.onopen = () => {
            console.log("connected websocket main component");

            this.setState({ ws: ws });

            that.timeout = 250; // reset timer to 250 on open of websocket connection 
            clearTimeout(connectInterval); // clear Interval on on open of websocket connection
            
        };
        // ws.onopen();
        // websocket onclose event listener
        ws.onclose = e => {
            console.log(
                `Socket is closed. Reconnect will be attempted in ${Math.min(
                    10000 / 1000,
                    (that.timeout + that.timeout) / 1000
                )} second.`,
                e.reason
            );

            that.timeout = that.timeout + that.timeout; //increment retry interval
            connectInterval = setTimeout(this.check, Math.min(10000, that.timeout)); //call check function after timeout
        };

        // websocket onerror event listener
        ws.onerror = err => {
            console.error(
                "Socket encountered error: ",
                err.message,
                "Closing socket"
            );

            ws.close();
        };

        // ws.onmessage = function message(event) {
        //   var data = JSON.parse(event.data);
        //   // NOTE: We escape JavaScript to prevent XSS attacks.
        //   // var username = encodeURI(data['username']);
        //   console.log(data);
        //   // this.state.Projects.add(data);
        // };


        if (ws.readyState == WebSocket.OPEN) {
          ws.onopen();
          console.log("open is called");
        }
    };

    /**
     * utilited by the @function connect to check if the connection is close, if so attempts to reconnect
     */
    check = () => {
        const { ws } = this.state;
        if (!ws || ws.readyState == WebSocket.CLOSED) this.connect(); //check if websocket instance is closed, if so call `connect` function.
    };


  async shiftTab(e){
    e.preventDefault(e);
    
    await this.setState({
      currentTab : e.target.id
    });
    // if(e.target.value=="sprint"){
    //   document.getElementById("PBITaskEditForm").style.display="none";
    //   document.getElementById("PBITaskCreateForm").style.display="none";
    // }
  }

  

  componentDidUpdate(prevProps){
    if (this.props.Name !== prevProps.Name) {
      this.getProjects();
      // this.setSocket();
    }
    // const {ws} = this.props;
    // if (ws !== null) {
    //   this.sendMessage();
    // }
  }

checkIfScrum() {
   fetch('http://localhost:8000/projects/isScrumMaster/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({username:this.props.Name})
    })
      .then(res => res.json())
      .then(json => {
        console.log(json);
        if(json.stat == "success"){
          console.log("Check if ScrumMaster" + json);
          this.setState({
            isScrumMaster: true,
            currentTab: "allproducts",
          });
          console.log(this.state.isScrumMaster);
        }
        else{
          console.log("Check if ScrumMaster failed");
        }
      });
  }


  checkIfPO() {
    fetch('http://localhost:8000/projects/isProductOwner/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({username:this.props.Name})
    })
      .then(res => res.json())
      .then(json => {
        console.log(json);
        if(json.stat == "success"){
          console.log("Check if PO" + json);
          this.setState({
            isProductOwner: json.data,
          });
          console.log(this.state.isProductOwner);
        }
        else{
          console.log("Check if PO failed");
        }
      });
  }

  getProjects(){
    console.log(this.props.Name)
    fetch('http://localhost:8000/projects/showProjects/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({username:this.props.Name})
    })
      .then(res => res.json())
      .then(json => {
        console.log("Success get project");
        console.log(json);
        this.checkIfPO();
        if(json.detail!=="Signature has expired." && json.data.length>0){
          console.log("Inside jsondata")
          console.log("PROJECTS"+json.data)
          var arr = []
          arr = json.data;
          this.setState({
            ProjectsView:true,
            Projects:json.data
          });
          console.log("PROJECTS SET"+this.state.Projects[0].title)
          this.getProductOwnerName();
          this.checkIfScrum();
          
          this.render();
          if(arr.length===1){
            $("#deleteProject").attr('disabled',false);
            $("#createProject").attr('disabled',true);
          }
          else{
            $("#deleteProject").attr('disabled', true);
            $("#createProject").attr('disabled', false);
          }
        }
        else{
          this.setState({
            ProjectsView:false
          });
          $("#deleteProject").attr('disabled', true);
            $("#createProject").attr('disabled', false);
        }
      });
  }

  getProductOwnerName(){
    fetch('http://localhost:8000/projects/getProductOwnerName/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({product_title:this.state.Projects[0].title})
    })
    .then(res => res.json())
    .then(json => {
        console.log(json);
        this.setState({
            ProductOwnerName: json.data
        })
        console.log("PO SET"+this.state.ProductOwnerName)
     });
  }

  handleLogout(e) {
    e.preventDefault(e);
    this.props.handleLogout(e);
  }

  initiateCreateModelButton(e){
    e.preventDefault(e);
    var modal = document.getElementById("myModal");
    modal.style.display = "block";
  }

  closeModal(event){
      event.preventDefault(event);
      var modal = document.getElementById("myModal");
      modal.style.display = "none";
  }

  deleteProject(e){
    e.preventDefault(e);
    var arr = [];
    arr = this.state.Projects;
    console.log(arr);
    var id = arr[0].id;
    fetch('http://localhost:8000/projects/deleteProject/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({project_id:id})
    })
      .then(res => res.json())
      .then(json => {
        console.log(json);
        if(json.data==="success"){
          this.setState({
            ProjectsView:false,
            Projects:[]
          });
          $("#deleteProject").attr('disabled',true);;
          $("#createProject").attr('disabled',false);;
        }
        else{
          console.log("Project Creation Failed!");
        }
      });
  }

  async handleSelected(id) {
    console.log(id)
    await this.setState({
        productSelected: id,
        ProjectsView: true,
        currentTab: "productBacklog",
    });
    console.log(this.state.productSelected);
  }

  createProject(e){
    e.preventDefault(e);
    var title = $("#projectTitle").val();
    var content = $("#projectContent").val();
    var capacity = $("#projectSprintCapacity").val();
    console.log(title);console.log(content);
    
    fetch('http://localhost:8000/projects/createProject/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({username:this.props.Name, title: title, content: content, capacity: capacity})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat === "success"){
          var arr = this.state.Projects;
          arr.push(json.data[0]);
          this.setState({
            Projects: arr,
            ProjectsView: true
          });
          $("#projectContent").val("");
          $("#projectTitle").val("");
          if(arr.length===1){
            $("#deleteProject").attr('disabled', false);;
            $("#createProject").attr('disabled', true);;
          }
          else{
            $("#deleteProject").attr('disabled', true);;
            $("#createProject").attr('disabled', false);;
          }
        }
        else{
          console.log("Project Creation Failed!");
        }
      });
    var modal = document.getElementById("myModal");
    modal.style.display = "none";

    // try {
    //   console.log(this.props.ws);
    //   const {ws} = this.props;
      
    //   console.log(ws);
    //   ws.send(JSON.stringify({username:this.props.Name, title: title, content: content}));
    // } catch (error) {
    //     console.log(error) // catch error
    // }
      }

  render() {

    return (
      <div>
      
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
          <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarTogglerDemo01" aria-controls="navbarTogglerDemo01" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarTogglerDemo01">
            <a class="navbar-brand" href="#">Back Track</a>
            <ul class="navbar-nav mr-auto mt-2 mt-lg-0">
              <li class="nav-item active">
                <a class="nav-link" href="#">Dashboard <span class="sr-only">(current)</span></a>
              </li>
            </ul>
            <form class="form-inline my-2 my-lg-0">
            {this.state.isScrumMaster &&
                <button class="btn btn-outline-success my-2 my-sm-0" id="allproducts" onClick={this.shiftTab}>All Products</button>
              }
              &nbsp;&nbsp;
            <button class="btn btn-outline-success my-2 my-sm-0" id="productBacklog" onClick={this.shiftTab}>Product</button>&nbsp;&nbsp;
              <button class="btn btn-outline-success my-2 my-sm-0" id="sprint" onClick={this.shiftTab}>Sprint</button>&nbsp;&nbsp;
              <button class="btn btn-outline-success my-2 my-sm-0" id="scrum" onClick={this.shiftTab}>Progress</button>&nbsp;&nbsp;
              {this.state.isProductOwner &&
                <button id="createProject" class="btn btn-outline-success my-2 my-sm-0" data-toggle="modal" data-target="#exampleModal" data-whatever="@getbootstrap" onClick={this.initiateCreateModelButton}>Create Project</button>
              }&nbsp;&nbsp;
              {this.state.ProductOwnerName === this.props.Name &&
                <button id="deleteProject" class="btn btn-outline-danger my-2 my-sm-0" data-toggle="modal" data-target="#exampleModal" data-whatever="@getbootstrap" onClick={this.deleteProject}>Delete Project</button>
              }&nbsp;&nbsp;
              <button class="btn btn-outline-success my-2 my-sm-0" onClick={this.handleLogout}>Log Out</button>
              
            </form>
          </div>
        </nav>

        <div id="myModal" class="modal">
          <div class="modal-content">
            <span id="close" class="close" onClick={this.closeModal}>&times;</span>
            <h3 class="modal-title" Style="text-align: center;" id="exampleModalLabel">Create New Project</h3>
            <div class="modal-body">
              <form>
                <div class="form-group">
                  <label for="projectTitle" class="col-form-label">Title:</label>
                  <input type="text" class="form-control" id="projectTitle"/>
                </div>
                <div class="form-group">
                  <label for="projectContent" class="col-form-label">Description:</label>
                  <textarea class="form-control" id="projectContent"></textarea>
                </div>
                <div class="form-group">
                  <label for="projectSprintCapacity" class="col-form-label">Initial Sprint Capacity:</label>
                  <textarea class="form-control" id="projectSprintCapacity"></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onClick={this.closeModal} data-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" onClick={this.createProject}>Create</button>
            </div>
          </div>
        </div>

        <div className="Avatar">Hi {this.props.Name}!</div>
        {this.state.ProjectsView ? (
        <div className="projectView">
          {/* <table class="table table-sm table-dark table-hover ">
            <thead>
              <tr>
                <th>#</th>
                <th>My Projects</th>
                <th>Description</th>
                <th>Created On</th>
              </tr>
            </thead> */}
            
              <Projects
                Projects={this.state.Projects}
                Name={this.props.Name}
                currentTab={this.state.currentTab}
                ws={this.state.ws}
                ProductOwnerName={this.state.ProductOwnerName}
                isScrumMaster={this.state.isScrumMaster}
                handleSelected={this.handleSelected}
                productSelected={this.state.productSelected}
              />
          {/* </table> */}
        </div>
      ):(
        <div>You don't have any projects at the moment. Create one to view your project!</div>
      )}
      </div>
    );
  }
}


class Projects extends React.Component {
  constructor(props) {
     super(props);
     this.saveDescription = this.saveDescription.bind(this);
     this.getPBIs = this.getPBIs.bind(this);
     this.getPBITasks = this.getPBITasks.bind(this);
     this.handlePBIStatusChange = this.handlePBIStatusChange.bind(this);
     this.handlePBIStoryPointsChange = this.handlePBIStoryPointsChange.bind(this);
     this.handlePBITaskStoryPointsChange = this.handlePBITaskStoryPointsChange.bind(this);
     this.handlePBIDescriptionChange = this.handlePBIDescriptionChange.bind(this);
     this.handlePBITaskDescriptionChange = this.handlePBITaskDescriptionChange.bind(this);
     this.handlePBITitleChange = this.handlePBITitleChange.bind(this);
     this.handlePBITaskTitleChange = this.handlePBITaskTitleChange.bind(this);
     this.URhandlePBIStatusChange = this.URhandlePBIStatusChange.bind(this);
     this.URhandlePBIStoryPointsChange = this.URhandlePBIStoryPointsChange.bind(this);
     this.URhandlePBIDescriptionChange = this.URhandlePBIDescriptionChange.bind(this);
     this.URhandlePBITitleChange = this.URhandlePBITitleChange.bind(this);
     this.CreatePBIFinal = this.CreatePBIFinal.bind(this);
     this.CreatePBITaskFinal = this.CreatePBITaskFinal.bind(this);
     this.deletePBI = this.deletePBI.bind(this);
     this.deletePBITask = this.deletePBITask.bind(this);
     this.ChangePBITaskEffort = this.ChangePBITaskEffort.bind(this);
     this.editPBIFinal = this.editPBIFinal.bind(this);
     this.editPBITaskFinal = this.editPBITaskFinal.bind(this);
     this.UReditPBIFinal = this.UReditPBIFinal.bind(this);
     this.editPBI = this.editPBI.bind(this);
     this.editPBITask = this.editPBITask.bind(this);
     this.editURPBI = this.editURPBI.bind(this);
     this.createPBI = this.createPBI.bind(this);
     this.createPBITask = this.createPBITask.bind(this);
     this.priorityUp = this.priorityUp.bind(this);
     this.priorityDown = this.priorityDown.bind(this);
     this.calculateCumPBIs = this.calculateCumPBIs.bind(this);
     this.pbifilterList = this.pbifilterList.bind(this);
     this.differentiatePBIs = this.differentiatePBIs.bind(this);
     this.urpbifilterList = this.urpbifilterList.bind(this);
     this.pbiTaskfilterList = this.pbiTaskfilterList.bind(this);
     this.addPBItoSprint = this.addPBItoSprint.bind(this);
     this.removePBIfromSprint = this.removePBIfromSprint.bind(this);
     this.saveSprintCondition = this.saveSprintCondition.bind(this);
     this.handlePBITaskAssignedToChange = this.handlePBITaskAssignedToChange.bind(this);
     this.sendMessage = this.sendMessage.bind(this);
     this.inviteDeveloper = this.inviteDeveloper.bind(this);
     this.inviteScrum = this.inviteScrum.bind(this);
     this.sendInvite = this.sendInvite.bind(this);
     this.getTeamDeveloperNames = this.getTeamDeveloperNames.bind(this);
     this.handlePBIPriorityChange = this.handlePBIPriorityChange.bind(this);
     this.endSprint = this.endSprint.bind(this);
     this.getSprintLoad = this.getSprintLoad.bind(this);
     this.checkSprintLoad = this.checkSprintLoad.bind(this);
     this.getcumEffortHours = this.getcumEffortHours.bind(this);
     this.removesprintPBIs = this.removesprintPBIs.bind(this);
     this.setProduct = this.setProduct.bind(this);
     this.state = {
      PBIs:[],
      // underReviewPbis:[],
      PBItitle:"",
      PBIstatus:"",
      PBIdescription:"",
      URPBItitle:"",
      URPBIstatus:"",
      URPBIdescription:"",
      URPBIstoryPoints:"",
      PBIstoryPoints:"",
      URPBICumCount: "",
      PBICumCount: "",
      RURPBICumCount: "",
      RPBICumCount: "",
      normalPBIs: [],
      URPBIs: [],
      PBITasktitle:"",
      PBITasks: [],
      normalPBITasks: [],
      PBITaskdescription:"",
      PBITaskstoryPoints:"",
      PBITaskCumCount: "",
      RPBITaskCumCount: "",
      // sprintPBIs: [],
      currentPBIID:"",
      PBIpriority: "",
      invitedDeveloper: false,
      invitedScrumMaster: false,
      Developers: [],
      ScrumMasters:[],
      inviteUserID: "",
      isDeveloper: false,
      isProductOwner: false,
      Product_Developers: [],
      sprintNum: "",
      sprintCapacity: "",
      totalSprintHours: "",
      remSprintHours: "",
      initialeditTaskHours: ""
    };
  }

  componentDidUpdate(prevProps){
    if (this.props.productSelected !== prevProps.productSelected) {
      console.log(this.props.isScrumMaster)
    console.log(this.props.currentTab)
    if(!this.props.isScrumMaster && this.props.currentTab !== "allproducts"){
      this.checkIfPO();
      this.checkIfDev();
      document.getElementById("PBIEditForm").style.display="none";
      document.getElementById("PBICreateForm").style.display="none";
      this.getcumEffortHours()
    }
    
    this.setState({
      sprintNum: this.props.Projects[this.props.productSelected].ongoingSprint,
      sprintCapacity: this.props.Projects[this.props.productSelected].sprintCapacity
    })

    if(this.props.currentTab === "sprint"){
      document.getElementById("URPBIEditForm").style.display="none";
      document.getElementById("PBITaskEditForm").style.display="none";
      document.getElementById("PBITaskCreateForm").style.display="none";
    }
    this.getPBIs();
    this.getTeamDeveloperNames();
    }
  }

  componentDidMount(){
    console.log(this.props.isScrumMaster)
    console.log(this.props.currentTab)
    if(!this.props.isScrumMaster && this.props.currentTab !== "allproducts"){
      this.checkIfPO();
      this.checkIfDev();
      document.getElementById("PBIEditForm").style.display="none";
      document.getElementById("PBICreateForm").style.display="none";
      this.getcumEffortHours()
    }
    
    this.setState({
      sprintNum: this.props.Projects[this.props.productSelected].ongoingSprint,
      sprintCapacity: this.props.Projects[this.props.productSelected].sprintCapacity
    })

    if(this.props.currentTab === "sprint"){
      document.getElementById("URPBIEditForm").style.display="none";
      document.getElementById("PBITaskEditForm").style.display="none";
      document.getElementById("PBITaskCreateForm").style.display="none";
    }
    this.getPBIs();
    this.getTeamDeveloperNames();
    

    if(this.props.ws!=null){
        this.props.ws.onmessage = evt => {
          // listen to data sent from the websocket server
          const message = JSON.parse(evt.data)
          // this.setState({dataFromServer: message})
          console.log(message)
          console.log("Message Received!")
          if(parseInt(message.completed_pbi) !== -1){
            var pbilist = this.state.PBIs;
            pbilist.map((pbi) => {
              if(pbi.id === parseInt(message.completed_pbi)) {
                pbi.status = "Complete"
              }
            });
            this.setState({
              PBIs: pbilist
            })
            this.differentiatePBIs(this.state.PBIs);
          }
        }
     }

  }

  getcumEffortHours(){
    console.log(this.props.Projects[this.props.productSelected].id)
    fetch('http://localhost:8000/projects/cumefforthours/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({prod_id:this.props.Projects[this.props.productSelected].id})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat == "success"){
          this.setState({
            totalSprintHours: json.hours,
            remSprintHours: json.remhours
          });
          console.log(this.state.totalSprintHours, this.state.remSprintHours);
          if(this.state.totalSprintHours === this.state.sprintCapacity) this.removesprintPBIs();
        }
        else{
          console.log("Failed to load Cum hours");
        }
      });
  }

  removesprintPBIs(){
    fetch('http://localhost:8000/projects/delPBIs/', {//removing unnecessary pbis because sprint capacity reached!
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({prod_id:this.props.Projects[this.props.productSelected].id})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat == "success"){
          this.setState({
            PBIs: json.data
          });
        }
        else{
          console.log("Failed delete pbis");
        }
      });
  }

  checkIfPO() {
    console.log("Username:" +this.props.Name)
    fetch('http://localhost:8000/projects/isProductOwner/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({username:this.props.Name})
    })
      .then(res => res.json())
      .then(json => {
        console.log(json);
        if(json.stat == "success"){
          console.log("Check if PO" + json);
          this.setState({
            isProductOwner: json.data,
          });
          console.log(this.state.isProductOwner);
        }
        else{
          console.log("Check if PO failed");
        }
      });
  }

  checkIfDev() {
    console.log("Username:" +this.props.Name)
    fetch('http://localhost:8000/projects/isDeveloper/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({username:this.props.Name})
    })
      .then(res => res.json())
      .then(json => {
        console.log(json);
        if(json.stat == "success"){
          console.log("Check if Developer" + json);
          this.setState({
            isDeveloper: json.data,
          });
          console.log(this.state.isDeveloper);
        }
        else{
          console.log("Check if Developer failed");
        }
      });
  }

  

  sendMessage(data){
    try {
      console.log("sending Message!");
      const {ws} = this.props;
      console.log(data)
      ws.send(data);
    } catch (error) {
        console.log(error) // catch error
    }
  }

  handlePBITitleChange(e) {
    e.preventDefault(e);
    this.setState({
      PBItitle: e.target.value
    });
    console.log(this.state.PBItitle)
  }

  handlePBITaskTitleChange(e) {
    e.preventDefault(e);
    this.setState({
      PBITasktitle: e.target.value
    });
    console.log(this.state.PBItitle)
  }

  handlePBIDescriptionChange(e) {
    e.preventDefault(e);
    this.setState({
      PBIdescription: e.target.value
    });
  }

  handlePBITaskDescriptionChange(e) {
    e.preventDefault(e);
    this.setState({
      PBITaskdescription: e.target.value
    });
  }

  handlePBIStatusChange(e) {
    e.preventDefault(e);
    console.log(e.target.value);
    this.setState({
      PBIstatus: e.target.value
    });
  }


  handlePBIStoryPointsChange(e) {
    e.preventDefault(e);
    this.setState({
      PBIstoryPoints: e.target.value
    });
  }

  handlePBITaskStoryPointsChange(e) {
    e.preventDefault(e);
    this.setState({
      PBITaskstoryPoints: e.target.value
    });
  }

  handlePBITaskAssignedToChange(e) {
    e.preventDefault(e);
    console.log(e.target.value)
    console.log("handlePBITaskAssignedToChange")
    this.setState({
      PBITaskAssignedTo: e.target.value
    });
  }

  handlePBIPriorityChange(e){
    e.preventDefault(e);
    this.setState({
      PBIpriority: e.target.value
    });
  }

  URhandlePBITitleChange(e) {
    e.preventDefault(e);
    this.setState({
      URPBItitle: e.target.value
    });
  }

  URhandlePBIDescriptionChange(e) {
    e.preventDefault(e);
    this.setState({
      URPBIdescription: e.target.value
    });
  }

  URhandlePBIStatusChange(e) {
    e.preventDefault(e);
    this.setState({
      URPBIstatus: e.target.value
    });
  }

  URhandlePBIStoryPointsChange(e) {
    e.preventDefault(e);
    this.setState({
      URPBIstoryPoints: e.target.value
    });
  }


  calculateCumPBIs(pbis){
    var ucount = 0
    var count = 0;
    var rcount = 0;
    var rucount = 0;
    pbis.map((pbi) => {
      if(pbi.status!=="Under Review") {
        count = count + parseInt(pbi.storyPoints);
        if(pbi.status!=="Complete") rcount = rcount + parseInt(pbi.storyPoints);
      }
      else{
        if(pbi.status!=="Complete") rucount = rucount + parseInt(pbi.storyPoints);
        ucount = ucount + parseInt(pbi.storyPoints)
      }
    });
    this.setState({
      URPBICumCount: ucount.toString(),
      PBICumCount: count.toString(),
      RURPBICumCount: rucount.toString(),
      RPBICumCount: rcount.toString()
    });

  }

  calculateCumPBITasks(PBITasks){
    var count = 0;
    var rcount = 0;
    PBITasks.map((Tasks) => {
      count = count + parseInt(Tasks.storyPoints);
      if(Tasks.status!=="Complete") rcount = rcount + parseInt(Tasks.storyPoints);
    });
    this.setState({
      PBITaskCumCount: count.toString(),
      RPBITaskCumCount: rcount.toString()
    });

  }

  saveSprintCondition(e){
    e.preventDefault(e);

    fetch('http://localhost:8000/projects/saveSprintCondition/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
   
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat === "success"){
          console.log(json);
          this.setState({
            PBIs: json.data,
          });
        }
        else{
          console.log("Update of sprint checker failed");
        }
      });
  }


  differentiatePBIs(pbis){
    var npbis = [];
    var urpbis = [];
    pbis.map((pbi) => {
      if(pbi.status!=="Under Review") npbis.push(pbi);
      else{
        urpbis.push(pbi);
      }
    });
    this.setState({
      normalPBIs: npbis,
      URPBIs: urpbis
    });
  }

  getPBIs(){
    console.log(this.props.Projects[this.props.productSelected].id);
    console.log(this.props.productSelected)
    fetch('http://localhost:8000/projects/getPBIs/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({product_id: this.props.Projects[this.props.productSelected].id})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat==="success"){
          console.log(json.data);
          this.calculateCumPBIs(json.data);
          this.setState({
            PBIs: json.data,
          });
          this.differentiatePBIs(json.data);
        }
        else{
          console.log("Cannot Load PBIS!");
        }
      });
  }

  getPBITasks(e){
    console.log(e.target.id);
     this.setState({
     currentPBIID: e.target.id
   });
    fetch('http://localhost:8000/projects/getPBITasks/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },

      body: JSON.stringify({PBI_id: e.target.id})
    })

      .then(res => res.json())
      .then(json => {
        if(json.stat==="success"){
          console.log(json.data)
          this.calculateCumPBITasks(json.data)
          
          this.setState({
            PBITasks: json.data,
            normalPBITasks: json.data
          });
        }
        else{
          console.log("Cannot Load PBI Tasks!");
        }
      });
  }


  editURPBI(e){
    e.preventDefault(e);
    this.state.PBIs.map((pbi) => {
      if(parseInt(pbi.id) === parseInt(e.target.id)){
        this.setState({
          URPBIdescription: pbi.description,
          URPBItitle:pbi.title,
          URPBIstatus:pbi.status,
          URPBIstoryPoints:pbi.storyPoints
        });
        document.getElementById("URPBIEditFormButton").setAttribute("rel", e.target.id);
      }
    });
    console.log(this.state.URPBIdescription)

    document.getElementById("URPBIEditForm").style.display="block";
    var objDiv = document.getElementById("subContainer");
    objDiv.scrollTop = objDiv.scrollHeight;
  }

  editPBI(e){
    e.preventDefault(e);
    this.state.PBIs.map((pbi) => {
      if(parseInt(pbi.id) === parseInt(e.target.id)){
        this.setState({
          PBIdescription: pbi.description,
          PBItitle:pbi.title,
          PBIstatus:pbi.status,
          PBIstoryPoints: pbi.storyPoints,
          PBIpriority: pbi.priority
        });
        document.getElementById("PBIEditFormButton").setAttribute("rel", e.target.id);
      }
    });
    console.log(this.state.PBIdescription)

    document.getElementById("PBIEditForm").style.display="block";
    document.getElementById("PBICreateForm").style.display="none";
    document.getElementById("createButton").style.display="block";
    var objDiv = document.getElementById("subContainer");
    objDiv.scrollTop = objDiv.scrollHeight;
  }


  editPBITask(e){
    e.preventDefault(e);
    this.state.PBITasks.map((Task) => {
      if(parseInt(Task.id) === parseInt(e.target.id)){
        this.setState({
          PBITaskdescription: Task.description,
          PBITasktitle:Task.title,
          PBITaskstoryPoints: Task.storyPoints,
          PBITaskAssignedTo: Task.assigined_team_member,
          initialeditTaskHours: Task.storyPoints
        });
        document.getElementById("PBITaskEditFormButton").setAttribute("rel", e.target.id);
      }
    });
    console.log(this.state.PBIdescription)

    document.getElementById("PBITaskEditForm").style.display="block";
    document.getElementById("PBITaskCreateForm").style.display="none";
    document.getElementById("createButtontwo").style.display="block";
    var objDiv = document.getElementById("subContainer");
    objDiv.scrollTop = objDiv.scrollHeight;
  }



  createPBI(e){
    e.preventDefault(e);
    this.setState({
      PBIdescription: "",
      PBItitle:"",
      PBIstatus:"",
      PBIstoryPoints:""
    });
    document.getElementById("PBIEditForm").style.display="none";
    document.getElementById("PBICreateForm").style.display="block";
    document.getElementById("createButton").style.display="none";
    var objDiv = document.getElementById("subContainer");
    console.log(objDiv)
    objDiv.scrollTop = objDiv.scrollHeight;
  }

  createPBITask(e){
    e.preventDefault(e);
    this.setState({
      PBITaskdescription: "",
      PBITasktitle:"",
      PBITaskstoryPoints:"",
      PBITaskAssignedTo:"Not Assigned"
    });
    document.getElementById("PBITaskEditForm").style.display="none";
    document.getElementById("PBITaskCreateForm").style.display="block";
    document.getElementById("createButtontwo").style.display="none";
    var objDiv = document.getElementById("subContainer");
    console.log(objDiv)
    objDiv.scrollTop = objDiv.scrollHeight;
  }


  deletePBI(e){
    e.preventDefault(e);
    console.log(this.state.PBIs);
    console.log(e.target.id);
    fetch('http://localhost:8000/projects/deletePBI/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({PBI_id: e.target.id})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat==="success"){
          this.calculateCumPBIs(json.data);
          this.differentiatePBIs(json.data);
          this.setState({
            PBIs: json.data,
          });
          console.log(json.data);
        }
        else{
          console.log("Failed to delete the PBI!");
        }
      });
  }


  deletePBITask(e){
    e.preventDefault(e);
    console.log(e.target.id);
    fetch('http://localhost:8000/projects/deletePBITask/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({PBITask_id: e.target.id})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat==="success"){
          this.calculateCumPBITasks(json.data);
          this.setState({
            PBITasks: json.data,
          });
          console.log(json.data);
          this.getcumEffortHours();
        }
        else{
          console.log("Failed to delete the PBI Task!");
        }
      });
  }


  ChangePBITaskEffort(e) {
    console.log(e.target.id);
    var id = e.targetid;
    //e.preventDefault(e);
    fetch('http://localhost:8000/projects/changePBITaskStatus/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({PBITask_id: e.target.id})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat==="success"){
          this.sendMessage(json.curr_task);
          this.calculateCumPBITasks(json.data);
          this.setState({
            PBITasks: json.data
          })
          this.getcumEffortHours();
        }
        else{
          console.log("Failed to change the PBI Task status!");
        }
      });
  }

  

  CreatePBIFinal(e){
    e.preventDefault(e);
    var title = this.state.PBItitle;
    var description = this.state.PBIdescription;
    var status = "Not Started";
    var storyPoints = this.state.PBIstoryPoints;
    var priority = this.state.PBIpriority;
    
    fetch('http://localhost:8000/projects/createPBI/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({title: title, priority: priority, description: description, status: status, product_id: this.props.Projects[this.props.productSelected].id, storyPoints: storyPoints})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat==="success"){
          
          // var arr = this.state.PBIs;
          // arr.push(json.data[0]);
          this.calculateCumPBIs(json.data);
          this.differentiatePBIs(json.data);
          this.setState({
            PBIs: json.data,
          });
        }
        else{
          console.log("Failed to Create a PBI!");
        }
      });

      $("#createTitle").val("");
      $("#createDescription").val("");
      $("#createStatus").val("");
      $("#createPriority").val("");
    // var objDiv = document.getElementById("subContainer");
    // objDiv.scrollTop = 0;
    document.getElementById("PBIEditForm").style.display="none";
    document.getElementById("PBICreateForm").style.display="none";
    document.getElementById("createButton").style.display="block";
  }

  checkSprintLoad(id, curr_load){
    return fetch('http://localhost:8000/projects/sprintload/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({pbi_id: id})
    })
      .then(res => res.json())
      .then(json => {
        if(json.data==="success"){
          var tot = parseInt(curr_load)+parseInt(json.load)
          console.log(tot, this.state.sprintCapacity);
          if(tot <= this.state.sprintCapacity) return true;
          else return false;
        }
        else{
          console.log("Failed to retrieve load!");
        }
      });
  }

  async CreatePBITaskFinal(e){
    e.preventDefault(e);
    var res = await this.checkSprintLoad(this.state.currentPBIID, this.state.PBITaskstoryPoints)
    console.log(res)
    if(res){
      console.log(e.target)
    var title = this.state.PBITasktitle;
    var description = this.state.PBITaskdescription;
    var storyPoints = this.state.PBITaskstoryPoints;
    var assigined_team_member = this.state.PBITaskAssignedTo;
    
    fetch('http://localhost:8000/projects/createPBITask/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({title: title, description: description, PBI_id: this.state.currentPBIID, storyPoints: storyPoints, assigined_team_member: assigined_team_member})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat==="success"){
          
          var arr = this.state.PBITasks;
          arr.push(json.data[0]);
          this.calculateCumPBITasks(arr);
          this.setState({
            PBITasks: arr,
          });
          this.getcumEffortHours();
        }
        else{
          console.log("Failed to Create a PBI!");
        }
      });

      $("#createTitle").val("");
      $("#createDescription").val("");
      $("#createStatus").val("");
    // var objDiv = document.getElementById("subContainer");
    // objDiv.scrollTop = 0;
    document.getElementById("PBITaskEditForm").style.display="none";
    document.getElementById("PBITaskCreateForm").style.display="none";
    document.getElementById("createButtontwo").style.display="block";
    }
    else{
      alert("Sprint Capacity: "+ this.state.sprintCapacity+" exceeded!!!");
    }
    
  }




  // CreatePBITaskFinal(e){
  //   e.preventDefault(e);
  //   var title = this.state.PBITasktitle;
  //   var description = this.state.PBITaskdescription;
  //   var storyPoints = this.state.PBITaskstoryPoints;
  //   console.log("create PBI Task Final");
  //   console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
  //   console.log(e.target.id)
  //   fetch('http://localhost:8000/projects/createPBITask/', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `JWT ${localStorage.getItem('token')}`
  //     },
  //     body: JSON.stringify({title: title, description: description, PBI_id: e.target.id, storyPoints: storyPoints})
  //   })
  //     .then(res => res.json())
  //     .then(json => {
  //       if(json.stat==="success"){
  //         console.log("success!");
  //         var arr = this.state.PBITasks;
  //         arr.push(json.data[0]);
  //         this.calculateCumPBITasks(arr);
  //         this.setState({
  //           PBITasks: arr,
  //         });
  //       }
  //       else{

  //         console.log("Failed to Create a Task!");
  //       }
  //     });

  //     $("#createTitle").val("");
  //     $("#createDescription").val("");
  //     $("#createStatus").val("");
  //   document.getElementById("PBITaskEditForm").style.display="none";
  //   document.getElementById("PBITaskCreateForm").style.display="none";
  //   document.getElementById("createButtontwo").style.display="block";
  // }



  editPBIFinal(e){
    e.preventDefault(e);

    var title = this.state.PBItitle;
    var description = this.state.PBIdescription;
    var status = this.state.PBIstatus;
    var storyPoints = this.state.PBIstoryPoints;
    var priority = this.state.PBIpriority

    console.log(e.target.getAttribute('rel'));
    fetch('http://localhost:8000/projects/editPBI/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({title: title, priority: priority, description: description, status: status, id: e.target.getAttribute('rel'), storyPoints: storyPoints})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat==="success"){
          this.calculateCumPBIs(json.data);
          this.differentiatePBIs(json.data);
          this.setState({
            PBIs: json.data,
          });
        }
        else{
          console.log("Failed to Edit a PBI!");
        }
      });

      $("#createTitle").val("");
      $("#createDescription").val("");
      $("#createStatus").val("");

    // var objDiv = document.getElementById("subContainer");
    // objDiv.scrollTop = 0;
    document.getElementById("PBIEditForm").style.display="none";
    document.getElementById("PBICreateForm").style.display="none";
    document.getElementById("createButton").style.display="block";

  }



  async editPBITaskFinal(e){
    e.preventDefault(e);
    var task_id = e.target.getAttribute('rel');
    var res = await this.checkSprintLoad(this.state.currentPBIID, this.state.PBITaskstoryPoints - this.state.initialeditTaskHours)
    console.log(res)
    if(res){
      var title = this.state.PBITasktitle;
      var description = this.state.PBITaskdescription;
      //var status = this.state.PBIstatus;
      var storyPoints = this.state.PBITaskstoryPoints;
      var assigined_team_member = this.state.PBITaskAssignedTo;
      fetch('http://localhost:8000/projects/editPBITask/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${localStorage.getItem('token')}`
        },
      body: JSON.stringify({title: title, description: description,  id: task_id, storyPoints: storyPoints, assigined_team_member: assigined_team_member })
      })
        .then(res => res.json())
        .then(json => {
          if(json.stat==="success"){
            this.calculateCumPBITasks(json.data);
            this.setState({
              PBITasks: json.data,
            });
            this.getcumEffortHours();
          }
          else{
            console.log("Failed to Edit a PBI Task!");
          }
        });

        $("#createTitle").val("");
        $("#createDescription").val("");
        $("#createStatus").val("");

      // var objDiv = document.getElementById("subContainer");
      // objDiv.scrollTop = 0;
      document.getElementById("PBITaskEditForm").style.display="none";
      document.getElementById("PBITaskCreateForm").style.display="none";
      document.getElementById("createButtontwo").style.display="block";
    }
    else{
      alert("Sprint Capacity: "+ this.state.sprintCapacity+" exceeded!!!");
    }

  }


  UReditPBIFinal(e){
    e.preventDefault(e);

    var title = this.state.URPBItitle;
    var description = this.state.URPBIdescription;
    var status = this.state.URPBIstatus;
    var storyPoints = this.state.URPBIstoryPoints;
    fetch('http://localhost:8000/projects/editPBI/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({title: title, description: description, status: status, id: e.target.getAttribute('rel'), storyPoints: storyPoints})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat==="success"){
          this.calculateCumPBIs(json.data);
          this.differentiatePBIs(json.data);
          this.setState({
            PBIs: json.data,
          });
        }
        else{
          console.log("Failed to Edit a PBI!");
        }
      });

      $("#URcreateTitle").val("");
      $("#URcreateDescription").val("");
      $("#URcreateStatus").val("");

    // var objDiv = document.getElementById("subContainer");
    // objDiv.scrollTop = 0;
    document.getElementById("URPBIEditForm").style.display="none";

  }

  saveDescription(e){
    e.preventDefault(e);
    var description = $("#projDescription").val();
    console.log(description)
    fetch('http://localhost:8000/projects/saveProjectDescription/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({id:this.props.Projects[this.props.productSelected].id, description: description})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat === "success"){
          console.log(json);
          this.setState({
            Projects: json.data,
          });
        }
        else{
          console.log("Project Description Edit Failed!");
        }
      });
  }

  inviteScrum(e) {
    e.preventDefault(e);
    this.setState({invitedScrumMaster: true});
    fetch('http://localhost:8000/projects/inviteScrumMaster/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `JWT ${localStorage.getItem('token')}`
        }
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat === "success"){
          console.log("Success scrum");
          console.log(json);
          this.setState({
            ScrumMasters: json.data,
          });
        }
        else{
          console.log("Show scrum masters failed");
        }
      });
  }
  inviteDeveloper(e) {
    e.preventDefault(e);
    this.setState({invitedDeveloper: true});
    fetch('http://localhost:8000/projects/inviteDeveloper/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `JWT ${localStorage.getItem('token')}`
        }
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat === "success"){
          console.log("Success developer");
          console.log(json);
          this.setState({
            Developers: json.data,
          });
        }
        else{
          console.log("Show developers failed");
        }
      });
  }
  async getUserID(email,e) {
    console.log(e.target)
    console.log("EMAIL IS: "+e.target.value)
    var em = e.target.value
    await fetch('http://localhost:8000/projects/getUserID/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({email:e.target.value})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat === "success"){
          console.log(json.data);
          console.log(this.state.inviteUserID)
          this.setState({
            inviteUserID: json.data,
          });
          console.log(this.state.inviteUserID)
        }
        else{
          console.log("Find ID failed");
        }
      })
      this.sendInvite(em);
  }
  sendInvite(user_email) {
    console.log("Invite to this user id:"+this.state.inviteUserID)
    console.log(this.props.Projects[this.props.productSelected].title)
    fetch('http://localhost:8000/projects/sendEmail/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({product_title:this.props.Projects[this.props.productSelected].title,user_id:this.state.inviteUserID,email:user_email})
    })
  }

  priorityUp(e){
    console.log(e.target.id);
    e.preventDefault(e);
    var pbi_id = e.target.id;
    console.log(pbi_id);
    fetch('http://localhost:8000/projects/priorityUp/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({id:pbi_id})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat === "success"){
          console.log(json);
          this.setState({
            PBIs: json.data,
          });
        }
        else{
          console.log("Priority Up Failed!");
        }
      });

  }

  priorityDown(e){
    console.log(e.target.id);
    e.preventDefault(e);
    var pbi_id = e.target.id;
    fetch('http://localhost:8000/projects/priorityDown/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({id:pbi_id})
    })
      .then(res => res.json())
      .then(json => {
        if(json.stat === "success"){
          console.log(json);
          this.setState({
            PBIs: json.data,
          });
        }
        else{
          console.log("Priority Down Failed!");
        }
      });
  }

  getSprintLoad(id){
    var load = 0
    this.state.PBIs.map((pbi) => {
      if(pbi.checked || parseInt(id) === pbi.id) {
        load += pbi.storyPoints;
      }
    });
    return load;
  }

      addPBItoSprint(e) {
        e.preventDefault(e);
        // var load = this.getSprintLoad(e.target.id);
          fetch('http://localhost:8000/projects/addPBItoSprint/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `JWT ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({id: e.target.id, checked: 'true'})
          })
            .then(res => res.json())
            .then(json => {
              if(json.stat === "success"){
                console.log(json.data);
                this.setState({
                  PBIs: json.data,
                });
              }
              else{
                console.log("Update of sprint checker failed");
              }
            });
        
  
      }
  
  
      removePBIfromSprint(e) {
        e.preventDefault(e);
        console.log(e.target.id);
        console.log("Request being sent");
        fetch('http://localhost:8000/projects/removePBIfromSprint/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `JWT ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({id: e.target.id})
        })
          .then(res => res.json())
          .then(json => {
            if(json.stat === "success"){
              console.log(json);
              this.setState({
                PBIs: json.data,
              });
              console.log("success")
            }
            else{
              console.log("Update of sprint checker failed");
            }
          });
      }


  pbifilterList(e){
    var pbis = this.state.normalPBIs;
    var updatedList = pbis;
    updatedList = updatedList.filter(function(item){
      return item.title.toLowerCase().search(
        e.target.value.toLowerCase()) !== -1;
    });
    var upList = JSON.parse(JSON.stringify(this.state.URPBIs));
    updatedList.map((pbi)=>{
      upList.push(pbi);
    });
    
    this.setState({PBIs: upList});
  }

  pbiTaskfilterList(e){
    var tasks_pbi = this.state.normalPBITasks;
    var updatedList = tasks_pbi;
    updatedList = updatedList.filter(function(item){
      return item.title.toLowerCase().search(
        e.target.value.toLowerCase()) !== -1;
    });
    this.setState({PBITasks: updatedList});
    
  }

  endSprint(){
    var nextsprintCapacity = prompt("Please enter Sprint Capacity of next sprint:", "");
    if (nextsprintCapacity != null) {
      var sprintPbis = []
      this.state.PBIs.map((pbi) => {
        if(pbi.checked) {
          sprintPbis.push(pbi.id)
        }
      });
      console.log(sprintPbis)

      fetch('http://localhost:8000/projects/endSprint/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({sprintPBIs: sprintPbis, sprintCapacity: nextsprintCapacity})
      })
      .then(res => res.json())
      .then(json => {
          this.setState({
            PBIs: json.data,
            sprintNum: json.sprint,
            PBITasks: [],
            sprintCapacity: json.capacity,
            PBITaskCumCount: "0",
            RPBITaskCumCount: "0"
          })
          this.getcumEffortHours();
      });
    }

    
  }

  getTeamDeveloperNames(e){
    fetch('http://localhost:8000/projects/PBITask/Developers/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({product_id: this.props.Projects[this.props.productSelected].id})
    })
    .then(res => res.json())
    .then(json => {
        console.log(json);
        this.setState({
          Product_Developers: json.data
        })
        console.log("Team Members are"+ this.state.Product_Developers)
     });
  }



  dropdown  = () => {
    let menu = []
    menu.push(<option value="Not Assigned">Not Assigned</option>)
    console.log(this.state.Product_Developers)
    for (let i = 0; i < this.state.Product_Developers.length; i++) {
      menu.push(<option value={this.state.Product_Developers[i].author.toString()}>{this.state.Product_Developers[i].author.toString()}</option>)
    }
    
    return menu
  }

  setProduct(e){
    console.log(e.target)
    this.props.handleSelected(e.target.id);
  }


  urpbifilterList(e){
    var urpbis = this.state.URPBIs;
    var updatedList = urpbis;
    updatedList = updatedList.filter(function(item){
      return item.title.toLowerCase().search(
        e.target.value.toLowerCase()) !== -1;
    });
    var upList = JSON.parse(JSON.stringify(this.state.normalPBIs));
    updatedList.map((pbi)=>{
      upList.push(pbi);
    });
    
    this.setState({PBIs: upList});
  }


  render() {
    let pbis = [];
    let PbiTasks =  []; //JSON.stringify(this.state.PBITasks);
    let underReviewPbis = [];
    let sprintPBIs = [];
    let pbis_done = [];
    var n = 0;
    var cn =0;
    var un=0;
    var ur = 0;

            this.state.PBITasks.map((Tasks) => {
              PbiTasks.push (
                  <div Style="border-bottom: rgb(109, 71, 151) solid 2px">
                  <p>
                      <div class="toast-header">
                          <strong class="mr-auto">{Tasks.title}</strong>
                          <div class="row">
                              <div  class="toast-body col">
                                  <div Style="float:left;">
                                   {Tasks.description}    
                                  </div>
                              </div>
                              <div class="col-md-6" Style="margin-top: 0px; margin-bottom:2px;float:right;">
                                  <small class="text-muted" Style="float:right;">
                                  <span Style="color: rgb(219, 69, 199); ">Status: </span> <text> {Tasks.status} </text>
                                  <span Style="color: rgb(219, 69, 199); ">Effort Hours/s: </span> <text> {Tasks.storyPoints} </text>
                              </small><br/>
                                  <font class="text-muted" >Assigned To: {Tasks.assigined_team_member} </font>
                                        {this.state.isDeveloper &&
                                            <div>
                                                <button id={Tasks.id}  onClick={this.deletePBITask} type="button" class="btn btn-danger" Style="float: right; padding:4px">
                                                    <span id={Tasks.id} aria-hidden="true" Style="color: white; font-size:15px; ">Delete</span>
                                                </button>
                                                <button id={Tasks.id} onClick={this.editPBITask} type="button" class="btn btn-primary" Style=" float: right; margin-right: 2px; padding:4px">
                                                        <span id={Tasks.id} Style="color:white; font-size:15px">Edit</span>
                                                </button>
                                            </div>
                                        }
                                        {(() => {
                                            if (Tasks.assigined_team_member == "Not Assigned" || Tasks.status == "Complete") {
                                              return (
                                                null
                                              )
                                            } else {
                                              return (
                                                <button id={Tasks.id} onClick={this.ChangePBITaskEffort} type="button" class="btn btn-success" Style=" float: right; margin-right: 2px; padding:4px">
                                                 <span id={Tasks.id} Style="color:white; font-size:15px">Done</span> </button>
                                              )
                                            }
                                          })()}
                              </div>
                          </div>
                      </div>
                      
                  </p>
              </div>
            );
            }
            );

    this.state.PBIs.map((pbi) => {
      if(pbi.status==="Under Review") ur+=1;
      else{
        n+=1;
      }
    });


    this.state.PBIs.map((pbi) => {
      if(pbi.status === "Complete") {
        
        pbis_done.push (
          <div Style="border-bottom: rgb(109, 71, 151) solid 2px">
          <p>
              <div class="toast-header">
                  <strong class="mr-auto">{pbi.title}</strong>
                  <div class="row">
                      <div  class="toast-body col">
                          <div Style="float:left;">
                           {pbi.description}    
                          </div>
                      </div>
                      <div class="col-md-6" Style="margin-top: 0px; margin-bottom:2px;float:right;">
                          <small class="text-muted" Style="float:right;">
                              <span Style="color: rgb(219, 69, 199); ">Status: </span>{pbi.status}
                          </small><br/>
                      </div>   
                  </div>
              </div>
              
          </p>
        </div>
    );

        
      }
    }
    );
    

        // Chhavi
        this.state.PBIs.map((pbi) => {
          if(pbi.checked === true && parseInt(pbi.completedSprint) === -1) {
            
            sprintPBIs.push (
              <div Style="border-bottom: rgb(109, 71, 151) solid 2px">
              <p>
                  <div class="toast-header">
                      <strong class="mr-auto">{pbi.title}</strong>
                      <div class="row">
                          <div  class="toast-body col">
                              <div Style="float:left;">
                               {pbi.description}    
                              </div>
                          </div>
                          <div class="col-md-6" Style="margin-top: 0px; margin-bottom:2px;float:right;">
                              <small class="text-muted" Style="float:right;">
                                  <span Style="color: rgb(219, 69, 199); ">Status: </span>{pbi.status}
                              </small><br/>
                              <div Style="display:inline-block">
                                  {(this.state.isDeveloper || this.props.isScrumMaster) &&
                                        <button id={pbi.id} onClick={this.removePBIfromSprint} type="button" class="btn btn-danger" Style=" float: right; margin-right: 2px; margin-top: 2px; padding:4px">
                                          <span id={pbi.id} Style="color:white; font-size:15px">Remove PBI</span>
                                        </button>
                                  }
                                  <button id={pbi.id} onClick={this.getPBITasks} type="button" class="btn btn-success" Style=" float: right; margin-right: 2px; margin-top: 2px; padding:4px">
                                          <span id={pbi.id} Style="color:white; font-size:15px">Show Tasks</span>
                                  </button>
                              </div>
                          </div>   
                      </div>
                  </div>
                  
              </p>
          </div>
        );
    
            
          }
        }
        );
        // Chhavi

    this.state.PBIs.map((pbi) => {
      if(pbi.status!=="Under Review"){
        cn+=1;
      pbis.push(

        <div Style="border-bottom: rgb(109, 71, 151) solid 2px">
                        <p>
                            <div class="toast-header">
                                <i>Story Points: <strong class="mr-auto">{pbi.storyPoints}</strong></i>
                                <br/><i>Priority: <strong class="mr-auto">{pbi.priority}</strong></i>
                                <div class="row">
                                    <div  class="toast-body col">
                                        <div Style="float:left;">
                                        <strong class="mr-auto">{pbi.title}</strong><br/>
                                         {pbi.description}    
                                        </div>
                                    </div>
                                    <div class="col-md-5" Style="margin-top: 0px; margin-bottom:2px;float:right;">
                                        <small class="text-muted" Style="float:right;">
                                            <span Style="color: rgb(219, 69, 199); ">Status: </span>{pbi.status}
                                        </small><br/>
                                        {cn===1 && cn===n?(<span><br/><br/></span>):(<span >{cn===1?(<span><span id={pbi.id} onClick={this.priorityDown}>
                                          <i id={pbi.id} Style="float:right; margin-right: 5px;"class="fa fa-angle-double-down"></i></span><br/></span>
                                        ):(<span >{cn===n?(
                                          <span id={pbi.id} onClick={this.priorityUp}><i id={pbi.id} Style="float:right; margin-right: 5px;"class="fa fa-angle-double-up"></i><br/></span>
                                        ):(
                                          <span><span id={pbi.id} onClick={this.priorityUp}><i id={pbi.id} Style="float:right; margin-right: 5px;"class="fa fa-angle-double-up"></i></span><br/>
                                          <span id={pbi.id} onClick={this.priorityDown}><i id={pbi.id} Style="float:right; margin-right: 5px;"class="fa fa-angle-double-down"></i></span><br/></span>
                                        
                                        )}</span>
                                          )}</span>
                                        )}

                                        {(this.state.isProductOwner || this.state.isDeveloper ) &&
                                            <div>
                                                <button id={pbi.id}  onClick={this.deletePBI} type="button" class="btn btn-danger" Style="float: right; padding:4px">
                                                    <span id={pbi.id} aria-hidden="true" Style="color: white; font-size:15px; ">delete</span>
                                                </button>
                                                <button id={pbi.id} onClick={this.editPBI} type="button" class="btn btn-primary" Style=" float: right; margin-right: 2px; padding:4px">
                                                    <span id={pbi.id} Style="color:white; font-size:15px">edit</span>
                                                </button>
                                            </div>
                                        }
                                        {this.props.currentTab!=="productBacklog" && (this.state.isDeveloper || this.props.isScrumMaster) && (pbi.status !== "Complete") &&
                                              <button id={pbi.id} rel={pbi.storyPoints} onClick={this.addPBItoSprint} type="button" class="btn btn-primary" Style=" float: right; margin-right: 2px; margin-top: 2px; padding:4px">
                                                <span id={pbi.id} Style="color:white; font-size:15px">Add to Sprint</span>
                                              </button>
                                        }
                                        
                                    </div>   
                                </div>
                            </div>
                            
                        </p>
                    </div>
        );
      }
      else{
        un+=1;
        underReviewPbis.push(
          <div Style="border-bottom: rgb(109, 71, 151) solid 2px">
                        <p>
                            <div class="toast-header">
                                <i>Story Points: <strong class="mr-auto">{pbi.storyPoints}</strong></i>
                                <br/><i>Priority: <strong class="mr-auto">{pbi.priority}</strong></i>
                                <div class="row">
                                  <div  class="toast-body col">
                                        <div Style="float:left;">
                                        <strong class="mr-auto">{pbi.title}</strong><br/>
                                         {pbi.description}    
                                        </div>
                                    </div>
                                    <div class="col-md-6" Style="margin-top: 0px; margin-bottom:2px;float:right;">
                                        <small class="text-muted" Style="float:right;">
                                            <span Style="color: rgb(219, 69, 199); ">Status: </span>{pbi.status}
                                        </small><br/>
                                        {un===1 && un===ur?(<span><br/><br/></span>):(<span >{un===1?(<span><span id={pbi.id} onClick={this.priorityDown}>
                                          <i id={pbi.id} Style="float:right; margin-right: 5px;"class="fa fa-angle-double-down"></i></span><br/></span>
                                        ):(<span >{un===ur?(
                                          <span id={pbi.id} onClick={this.priorityUp}><i id={pbi.id} Style="float:right; margin-right: 5px;"class="fa fa-angle-double-up"></i><br/></span>
                                        ):(
                                          <span><span id={pbi.id} onClick={this.priorityUp}><i id={pbi.id} Style="float:right; margin-right: 5px;"class="fa fa-angle-double-up"></i></span><br/>
                                          <span id={pbi.id} onClick={this.priorityDown}><i id={pbi.id} Style="float:right; margin-right: 5px;"class="fa fa-angle-double-down"></i></span><br/></span>
                                        
                                        )}</span>
                                          )}</span>
                                        )}
                                        {this.state.isProductOwner &&
                                            <div>
                                                <button id={pbi.id}  onClick={this.deletePBI} type="button" class="btn btn-danger" Style="float: right; padding:4px">
                                                    <span id={pbi.id} aria-hidden="true" Style="color: white; font-size:15px; ">delete</span>
                                                </button>
                                                <button id={pbi.id} onClick={this.editURPBI} type="button" class="btn btn-primary" Style=" float: right; margin-right: 2px; padding:4px">

                                                        <span id={pbi.id} Style="color:white; font-size:15px">edit</span>
                                                </button>
                                            </div>
                                        }

                                    </div>   
                                </div>
                            </div>
                            
                        </p>
                    </div>
        );
      }
      
    });
    // return (
    //   <tbody>
    //     {pbis}
		//   </tbody>
    // );

    // let projects = [];
    // var count = 1;
    // let options = {
    //     weekday: 'long',
    //     year: 'numeric',
    //     month: 'short',
    //     day: 'numeric',
    //     hour: '2-digit',
    //     minute: '2-digit'
    // };

    // this.props.Projects.map((project) => {
    //   var created = new Date((project.created_on.toString())).toLocaleString('en-us', options);
    //   projects.push(
    //     <tr>
    //         <td > {count} </td>
    //         <td >{project.title}</td>
    //         <td >{project.content}</td>
    //         <td >{created}</td>
    //     </tr>
    //     );
    //   count+=1;
    // });
    // return (
    //   <tbody>
    //     {projects}
    //   </tbody>
    // );
    let view = []
    let allDevelopers = this.state.Developers.map((d) =>
        <button type="button" onClick={this.getUserID.bind(this, this.state.Developers)} value={d}>{d}</button>
    );
    let allScrumMasters = this.state.ScrumMasters.map((sm) =>
        <button type="button" onClick={this.getUserID.bind(this, this.state.ScrumMasters)} value={sm}>{sm}</button>
    );
    if(this.props.currentTab === "scrum"){
      view.push(
        <div class="row">
        <ComplexDonut product_id = {this.props.Projects[this.props.productSelected].id} />
        {/* <Donut product_id = {this.props.Projects[this.props.productSelected].id} /> */}
        <VelocityChart product_id = {this.props.Projects[this.props.productSelected].id} />
      </div>
      )
    }
    else if(this.props.currentTab === "allproducts"){
      let projs = []
      this.props.Projects.map((p, index) =>
        projs.push(
          <tr onClick={this.setProduct} id={index}>
            <td id={index}>{index}</td>
            <td id={index}>{p.title}</td>
            <td id={index}>{p.content}</td>
            <td id={index}>{p.created_on}</td>
          </tr>
        ),
      );
      view.push(
        <table class="table table-sm table-dark table-hover ">
              <thead>
                <tr>
                  <th>#</th>
                  <th>My Projects</th>
                  <th>Description</th>
                  <th>Created On</th>
                </tr>
              </thead>
              <tbody>
              {projs}
              </tbody>
      </table>
     )
    }
    else if(this.props.currentTab === "productBacklog"){
      view.push(
        <div class="row">
        <div class="col-sm">
    <div class="card " Style="height: 90%; width:350px; padding:0px;">
    <h3  Style="margin: 2px; background-color: rgb(231, 231, 231); text-align: center; padding:5px">{this.props.Projects[this.props.productSelected].title}</h3>
            <div class="container">
                <div> 
                  Description
                  {this.state.isProductOwner &&
                        <div>
                            <button onClick={this.saveDescription} type="button" class="btn btn-primary" Style=" float: right; margin-right: 2px; padding:4px"><span Style="color:white; font-size:15px">Save</span></button>
                            <br/><br/>
                        </div>
                  }

                </div>
                <textarea cols="30" id="projDescription" rows="8" name="description" Style="width:290px;">{this.props.Projects[this.props.productSelected].content}</textarea><br/><br/>
                <div class="panel-footer">
                  <p>
                    Product Owner: {this.props.ProductOwnerName}
                  </p>
                  <p>
                    Scrum Master
                    {this.state.isProductOwner &&
                        <button type="button" onClick={this.inviteScrum}  type="button" class="btn btn-primary" Style="float: right; margin-right: 2px; padding:4px"><span Style="color:white; font-size:15px">Invite</span></button>
                    }
                  </p>
                  <div>
                    {!this.state.ScrumMasters.length ?
                        (
                            <p></p>
                        ) : (
                            <p>{allScrumMasters}</p>
                        )
                    }
                  </div>
                  <p>
                    Developers
                    {this.state.isProductOwner &&
                        <button type="button" onClick={this.inviteDeveloper}  type="button" class="btn btn-primary" Style=" float: right; margin-right: 2px; padding:4px"><span Style="color:white; font-size:15px">Invite</span></button>
                    }
                  </p>
                  <div>
                    {!this.state.Developers.length ?
                        (
                            <p></p>
                        ) : (
                            <p>{allDevelopers}</p>
                        )
                    }
                  </div>
                </div>
            </div>
        </div>
      </div>


<div class="col-sm">
              <div class="card " Style="height: 90%; width:350px; padding:0px;">
                <h3  Style="margin: 2px; background-color: rgb(231, 231, 231); text-align: center; padding:5px">Product Backlog</h3>
                <h6  Style="margin: 2px; background-color: white; text-align: left; padding:5px; font-size:15px;"><input type="text" className="form-control form-control-lg" placeholder="Search" onChange={this.pbifilterList}/></h6>
                <h6  Style="margin: 2px; background-color: white; text-align: left; padding:5px; font-size:15px;">Cumulative StoryPoints: {this.state.RPBICumCount} / {this.state.PBICumCount}</h6>
                <div id="subContainer" class="card scrollbar scrollbar-primary">
                    {pbis}
                    <div class="container">
                  <div id="PBIEditForm" Style="display:none;">
                    <br/><h3>Edit PBI</h3>
                    <label for="editTitle">Title</label>
                      <input class="form-control" type="text" id="editTitle" onChange={this.handlePBITitleChange} value={this.state.PBItitle}/><br/>
                    <label for="editDescription">Description</label>
                      <input class="form-control" type="text" id="editDescription" onChange={this.handlePBIDescriptionChange} value={this.state.PBIdescription}/><br/>
                    <label for="editStatus">Status</label>
                    <select class="form-control" id = "editStatus" onChange={this.handlePBIStatusChange} value={this.state.PBIstatus}>
                      <option value = "Not Started">Not Started</option>
                      <option value = "In Progress">In Progress</option>
                      <option value = "Complete">Complete</option>
                      <option value = "Under Review">Under Review</option>
                    </select><br/>
                      {/* <input class="form-control" type="text" id="editStatus" onChange={this.handlePBIStatusChange} value={this.state.PBIstatus}/><br/> */}
                    <label for="editStoryPoints">Story Points</label>
                      <input type="number" value={this.state.PBIstoryPoints} onChange={this.handlePBIStoryPointsChange} class="form-control" id="createStoryPoints"required/><br/>
                    <label for="createPriority">Priority</label>
                      <input type="number" value={this.state.PBIpriority} onChange={this.handlePBIPriorityChange} class="form-control" id="createPriority"required/><br/>
                    <button id="PBIEditFormButton" class="btn btn-primary" onClick={this.editPBIFinal}>Update</button>
                  </div>
                  <div id="PBICreateForm" Style="display:none;">
                  <br/><h3>Create PBI</h3>
                  <label for="createTitle">Title</label>
                      <input type="text" value={this.state.PBItitle} onChange={this.handlePBITitleChange} class="form-control" id="createTitle" required/><br/>
                    <label for="createDescription">Description</label>
                      <input type="text" value={this.state.PBIdescription} onChange={this.handlePBIDescriptionChange} class="form-control" id="createDescription"required/><br/>
                    <label for="createStoryPoints">Story Points</label>
                      <input type="number" value={this.state.PBIstoryPoints} onChange={this.handlePBIStoryPointsChange} class="form-control" id="createStoryPoints"required/><br/>
                    <label for="createPriority">Priority</label>
                      <input type="number" value={this.state.PBIpriority} onChange={this.handlePBIPriorityChange} class="form-control" id="createPriority"required/><br/>
                    {/* <label for="createStatus">Status</label>
                      <input type="text" value={this.state.PBIstatus} onChange={this.handlePBIStatusChange} class="form-control" id="createStatus"required/><br/> */}
                    <button class="btn btn-primary" onClick={this.CreatePBIFinal}>Create!</button><br/><br/>
                  </div>
                </div>
                </div>   
                {this.state.isProductOwner &&
                    <button onClick={this.createPBI} type="button"
                    class="btn"
                    Style="margin: 2px; background-color: rgb(204, 204, 204)"
                    id="createButton">
                        <strong>+ Create New PBI </strong>
                    </button>
                }

              </div>
          </div>


<div class="col-sm">
              <div class="card " Style="height: 90%; width:350px; padding:0px;">
                <h3  Style="margin: 2px; background-color: rgb(231, 231, 231); text-align: center; padding:5px">Under Review</h3>
                <h6  Style="margin: 2px; background-color: white; text-align: left; padding:5px; font-size:15px;"><input type="text" className="form-control form-control-lg" placeholder="Search" onChange={this.urpbifilterList}/></h6>
                <h6  Style="margin: 2px; background-color: white; text-align: left; padding:5px; font-size:15px;">Cumulative StoryPoints: {this.state.RURPBICumCount} / {this.state.URPBICumCount}</h6>
                <div id="subContainer" class="card scrollbar scrollbar-primary">
                    {underReviewPbis}
                    <div class="container">
                      <div id="URPBIEditForm" Style="display:none;">
                        <br/><h3>Edit PBI</h3>
                        <label for="editTitle">Title</label>
                          <input class="form-control" type="text" id="editTitle" onChange={this.URhandlePBITitleChange} value={this.state.URPBItitle}/><br/>
                        <label for="editDescription">Description</label>
                          <input class="form-control" type="text" id="editDescription" onChange={this.URhandlePBIDescriptionChange} value={this.state.URPBIdescription}/><br/>
                        <label for="editStatus">Status</label>
                        <select class="form-control" id = "editStatus" onChange={this.URhandlePBIStatusChange} value={this.state.URPBIstatus}>
                          <option value = "Not Started">Not Started</option>
                          <option value = "In Progress">In Progress</option>
                          <option value = "Complete">Complete</option>
                          <option value = "Under Review">Under Review</option>
                        </select><br/>
                          {/* <input class="form-control" type="text" id="editStatus" onChange={this.URhandlePBIStatusChange} value={this.state.URPBIstatus}/><br/> */}
                        <label for="editStoryPoints">Story Points</label>
                          <input type="number" value={this.state.URPBIstoryPoints} onChange={this.URhandlePBIStoryPointsChange} class="form-control" id="editStoryPoints"required/><br/>
                    
                        <button id="URPBIEditFormButton" class="btn btn-primary" onClick={this.UReditPBIFinal}>Update</button>
                      </div>
                    </div>
                </div>   
                
              </div>
          </div>


          {/* Done col starts */}
                
          <div class="col-sm">
              <div class="card " Style="height: 90%; width:350px; padding:0px;">
                <h3  Style="margin: 2px; background-color: rgb(231, 231, 231); text-align: center; padding:5px">Done PBIs</h3>
                <div id="subContainer" class="card scrollbar scrollbar-primary">
                    {pbis_done}
                </div>
              </div>
          </div>

          {/* Done col ends */}
        </div>
      )
    }
    else if(this.props.currentTab === "sprint"){
      view.push(
        <div class="row">

<div class="col-sm">
              <div class="card " Style="height: 90%; width:350px; padding:0px;">
                <h3  Style="margin: 2px; background-color: rgb(231, 231, 231); text-align: center; padding:5px">Product Backlog</h3>
                <h6  Style="margin: 2px; background-color: white; text-align: left; padding:5px; font-size:15px;"><input type="text" className="form-control form-control-lg" placeholder="Search" onChange={this.pbifilterList}/></h6>
                <h6  Style="margin: 2px; background-color: white; text-align: left; padding:5px; font-size:15px;">Cumulative StoryPoints: {this.state.RPBICumCount} / {this.state.PBICumCount}</h6>
                <div id="subContainer" class="card scrollbar scrollbar-primary">
                    {pbis}
                    <div class="container">
                  <div id="PBIEditForm" Style="display:none;">
                    <br/><h3>Edit PBI</h3>
                    <label for="editTitle">Title</label>
                      <input class="form-control" type="text" id="editTitle" onChange={this.handlePBITitleChange} value={this.state.PBItitle}/><br/>
                    <label for="editDescription">Description</label>
                      <input class="form-control" type="text" id="editDescription" onChange={this.handlePBIDescriptionChange} value={this.state.PBIdescription}/><br/>
                    <label for="editStatus">Status</label>
                      <input class="form-control" type="text" id="editStatus" onChange={this.handlePBIStatusChange} value={this.state.PBIstatus}/><br/>
                    <label for="editStoryPoints">Story Points</label>
                      <input type="number" value={this.state.PBIstoryPoints} onChange={this.handlePBIStoryPointsChange} class="form-control" id="createStoryPoints"required/><br/>
                    
                    <button id="PBIEditFormButton" class="btn btn-primary" onClick={this.editPBIFinal}>Update</button>
                  </div>
                  <div id="PBICreateForm" Style="display:none;">
                  <br/><h3>Create PBI</h3>
                  <label for="createTitle">Title</label>
                      <input type="text" value={this.state.PBItitle} onChange={this.handlePBITitleChange} class="form-control" id="createTitle" required/><br/>
                    <label for="createDescription">Description</label>
                      <input type="text" value={this.state.PBIdescription} onChange={this.handlePBIDescriptionChange} class="form-control" id="createDescription"required/><br/>
                    <label for="createStoryPoints">Story Points</label>
                      <input type="number" value={this.state.PBIstoryPoints} onChange={this.handlePBIStoryPointsChange} class="form-control" id="createStoryPoints"required/><br/>
                    {/* <label for="createStatus">Status</label>
                      <input type="text" value={this.state.PBIstatus} onChange={this.handlePBIStatusChange} class="form-control" id="createStatus"required/><br/> */}
                    <button class="btn btn-primary" onClick={this.CreatePBIFinal}>Create!</button><br/><br/>
                  </div>
                </div>
                </div>   

                {this.state.isProductOwner &&
                    <button onClick={this.createPBI} type="button"
                    class="btn"
                    Style="margin: 2px; background-color: rgb(204, 204, 204)"
                    id="createButton">
                        <strong>+ Create New PBI </strong>
                    </button>
                }

              </div>
          </div>

        <div class="col-sm">
        <div class="card " Style="height: 90%; width:350px; padding:0px;">
          <h3  Style="margin: 2px; background-color: rgb(231, 231, 231); text-align: center; padding:5px">Sprint Backlog</h3>
          <h6  Style="margin: 2px; background-color: white; text-align: left; padding:5px; font-size:15px;">Ongoing Sprint: {this.state.sprintNum}</h6>
          <h6  Style="margin: 2px; background-color: white; text-align: left; padding:5px; font-size:15px;">Sprint Capacity: {this.state.sprintCapacity}</h6>
              <h6  Style="margin: 2px; background-color: white; text-align: left; padding:5px; font-size:15px;">Remaining Cum. Sprint Effort Hours: {this.state.remSprintHours} / {this.state.totalSprintHours}</h6>
          <div id="subContainer" class="card scrollbar scrollbar-primary">
             {sprintPBIs}
          </div>   
          <button id="endSprint" class="btn btn-success" onClick={this.endSprint}>End Sprint</button>
      
        </div>
        </div>


<div class="col-sm">
<div class="card " Style="height: 90%; width:350px; padding:0px;">
  <h3  Style="margin: 2px; background-color: rgb(231, 231, 231); text-align: center; padding:5px">Tasks</h3>
  <h6  Style="margin: 2px; background-color: white; text-align: left; padding:5px; font-size:15px;"><input type="text" className="form-control form-control-lg" placeholder="Search" onChange={this.pbiTaskfilterList}/></h6>
  <h6  Style="margin: 2px; background-color: white; text-align: left; padding:5px; font-size:15px;">Cumulative Remaining Effort: {this.state.RPBITaskCumCount} / {this.state.PBITaskCumCount}</h6>
    <div id="subContainer" class="card scrollbar scrollbar-primary"> 
       {PbiTasks}
      <div class="container">
    <div id="PBITaskEditForm" Style="display:none;">
      <br/><h3>Edit Task</h3>
      <label for="editTitle">Title</label>
        <input class="form-control" type="text" id="editTitle" onChange={this.handlePBITaskTitleChange} value={this.state.PBITasktitle}/><br/>
      <label for="editDescription">Description</label>
        <input class="form-control" type="text" id="editDescription" onChange={this.handlePBITaskDescriptionChange} value={this.state.PBITaskdescription}/><br/>
      <label for="editStoryPoints">Effort Hour/s</label>
        <input type="number" value={this.state.PBITaskstoryPoints} onChange={this.handlePBITaskStoryPointsChange} class="form-control" id="createStoryPointTasks"required/><br/>
        <label for="EditAssignedTo">Assigned To</label>
        <select onChange={this.handlePBITaskAssignedToChange} >
        {this.dropdown()}
        </select>
      <button id="PBITaskEditFormButton" class="btn btn-primary" onClick={this.editPBITaskFinal}>Update</button>
      </div> 
    
    <div id="PBITaskCreateForm" Style="display:none;">
    <br/><h3>Create Tasks</h3>
    <label for="createTitle">Title</label>
        <input type="text" value={this.state.PBITasktitle} onChange={this.handlePBITaskTitleChange} class="form-control" id="createTitle" required/><br/>
      <label for="createDescription">Description</label>
        <input type="text" value={this.state.PBITaskdescription} onChange={this.handlePBITaskDescriptionChange} class="form-control" id="createDescription"required/><br/>
      <label for="createStoryPoints">Effort Hours</label>
      <input type="number" value={this.state.PBITaskstoryPoints} onChange={this.handlePBITaskStoryPointsChange} class="form-control" id="createStoryPoints"required/><br/>
      <label for="createAssignedTo">Assigned To</label>
      <select onChange={this.handlePBITaskAssignedToChange} >
        {this.dropdown()}
        </select>
      <button class="btn btn-primary" onClick={this.CreatePBITaskFinal}>Create! </button><br/><br/>
    </div>  
  </div> 
  </div>    

  {this.state.isDeveloper &&
      <button onClick={this.createPBITask} type="button"
      class="btn"
      Style="margin: 2px; background-color: rgb(204, 204, 204)"
      id="createButtontwo">
          <strong>+ Create New Tasks </strong>
      </button>
  }

</div>
</div> 


</div>

      )
    }
  return (
    <div>
      {view}
    </div>
  )

  }
}






class LoggedOutState extends React.Component {
  constructor(props) {
     super(props);
      //bind this to functions
      this.handleUserNameChange = this.handleUserNameChange.bind(this);
      this.handlePasswordChange = this.handlePasswordChange.bind(this);
      this.handleLoginClick = this.handleLoginClick.bind(this);
      this.handleBackToSignUp = this.handleBackToSignUp.bind(this);
  }

  handleUserNameChange(e) {
    e.preventDefault(e);
    this.props.onUserNameChange(e.target.value);
  }
  
  handlePasswordChange(e) {
    e.preventDefault(e);
    this.props.onPasswordChange(e.target.value);
  }
  
  handleLoginClick(e) {
    e.preventDefault(e);
    this.props.onLoginClick(e);
    this.props.onPasswordChange(e.target.value);
    this.props.onUserNameChange(e.target.value);
    $('#Username').val('');
    $('#Password').val('');
  }

  handleBackToSignUp(e){
    e.preventDefault(e);
    this.props.onBackToSignUp(e);
  }



  render() {
    let err="";
    if(this.props.authError === true){
      err="Login Authentication Error!";
    }

    return (
    <div className="login">
      <form id="auth">
    			<h2>Back Track</h2>
    			<p>{err}</p>
        		<label>Username: 
              <input
                id="Username"
                type="text"
                placeholder = "UserName"
                value={this.props.UserName}
                onChange={this.handleUserNameChange}
              />
            </label><br/>
        		<label>Password: 
              <input
                id="Password"
                type="password"
                placeholder = "Password"
                value={this.props.Password}
                onChange={this.handlePasswordChange}
            />
            </label><br/>
        		<button className="myButton" onClick={this.handleLoginClick}>Login</button><br/><br/>
            <button className="myButton" onClick={this.handleBackToSignUp}>Create an Account</button>
      </form>
		</div>
    );
  }
}


class CreateAccountState extends React.Component {
  constructor(props) {
     super(props);
      //bind this to functions
      this.handleUserNameChange = this.handleUserNameChange.bind(this);
      this.handlePasswordChange = this.handlePasswordChange.bind(this);
      this.handleSignUpClick = this.handleSignUpClick.bind(this);
      this.handleBackToLogin = this.handleBackToLogin.bind(this);
      this.handleEmailChange = this.handleEmailChange.bind(this);
      this.roleChange = this.roleChange.bind(this);
  }

  handleBackToLogin(e){
    e.preventDefault(e);
    this.props.onBackToLogin(e);
  }

  handleUserNameChange(e) {
    e.preventDefault(e);
    this.props.onUserNameChange(e.target.value);
  }
  
  handlePasswordChange(e) {
    e.preventDefault(e);
    this.props.onPasswordChange(e.target.value);
  }
  
  handleEmailChange(e) {
    e.preventDefault(e);
    this.props.onEmailChange(e.target.value);
  }

  handleSignUpClick(e) {
    e.preventDefault(e);
    this.props.onSignUpClick(e);
    this.props.onPasswordChange(e.target.value);
    this.props.onUserNameChange(e.target.value);
    this.props.onEmailChange(e.target.value);
    this.props.onroleChange(e.target.value);
    $('#Username').val('');
    $('#Password').val('');
    $('#Email').val('');
  }

  async roleChange(e) {
    e.preventDefault(e);
    console.log(e.target.value);
    await this.props.onroleChange(e.target.value);
    console.log(this.props.role)
  }



  render() {
    let err="";
    if(this.props.authError === true){
      err="Login Authentication Error!";
    }

    return (
    <div className="login">
      <form id="auth">
    			<h2>BackTrack</h2>
    			<p>{err}</p>
        		<label>Username: 
              <input
                id="Username"
                type="text"
                placeholder = "UserName"
                value={this.props.UserName}
                onChange={this.handleUserNameChange}
              />
            </label><br/>
        		<label>Password: 
              <input
                id="Password"
                type="password"
                placeholder = "Password"
                value={this.props.Password}
                onChange={this.handlePasswordChange}
            />
            </label><br/>
            <label>Email: 
              <input
                id="Email"
                type="email"
                placeholder = "Your Email"
                value={this.props.Email}
                onChange={this.handleEmailChange}
            />
            </label><br/>
            <label> Role:
            <select id="userrole" onChange={this.roleChange} >
              <option value="Developer">Developer</option>
              <option value="Manager">Manager</option>
              <option value="Product Owner">Product Owner</option>
            </select>
            </label><br/>
        		<button className="myButton" onClick={this.handleSignUpClick}>SignUp</button><br/><br/>
            <button className="myButton" onClick={this.handleBackToLogin}>Back to Login!</button>
      </form>
		</div>
    );
  }
}


export default BackTrack;

