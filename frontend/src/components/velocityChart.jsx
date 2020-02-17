import React, { Component } from "react";
import Chart from "react-apexcharts";

class VelocityChart extends Component {
  constructor(props) {
    super(props);
    this.getVelocityStats = this.getVelocityStats.bind(this);

    this.state = {
      options: {
        chart: {
          id: "basic-bar",
          dropShadow: {
            enabled: true,
            top: 0,
            left: 0,
            blur: 3,
            opacity: 0.5
          }
        },
        xaxis: {
          categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998]
        },
        title: {
          text: "Sprint Velocity Graph"
      },
      },
      series: [
        {
          name: "Current Product Velocity",
          data: [30, 40, 45, 50, 49, 60, 70, 91]
        }
      ]
    };
  }
  componentWillMount() {
    this.getVelocityStats();
  }
  getVelocityStats(){
    // console.log(this.props.Name)
    fetch('http://localhost:8000/projects/getVelocityStats/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({product_id: this.props.product_id})
    })
      .then(res => res.json())
      .then(json => {
    //    console.log(json);
       this.setState({series:
        [
            {
              name: "Current Product Velocity",
              data: json.data
            }
          ]});
      //  console.log((json.data).length)
      var foo = [];
      for (var i = 0; i < (json.data).length; i++) {
         foo.push(i);
      }
      this.setState({
        options: {
          chart: {
            id: "basic-bar",
            dropShadow: {
              enabled: true,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 0.5
            }
          },
          xaxis: {
            categories: foo
          },
          title: {
              text: "Velocity Graph"
          },
        }
      })
       console.log(json.data)
      });
  }

  render() {
    return (
      <div className="app">
        <div className="row">
          <div className="mixed-chart">
            <Chart
                options={this.state.options}
                series={this.state.series}
                type="line"
                width="800"
            />
            {/* {this.state.series} */}
          </div>
        </div>
      </div>
    );
  }
}

export default VelocityChart;
