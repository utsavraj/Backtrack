import React, { Component } from 'react';
import Chart from 'react-apexcharts';

class ComplexDonut extends Component {

  constructor(props) {
    super(props);
    this.getStats = this.getStats.bind(this);


    this.state = {
        options: {
            chart: {
                dropShadow: {
                enabled: true,
                color: '#111',
                top: -1,
                left: 3,
                blur: 3,
                opacity: 0.2
                }
            },
            stroke: {
                width: 0,
            },
            labels: ["Not Started", "In progress", "Complete"],
            dataLabels: {
                dropShadow: {
                blur: 2,
                opacity: 5
                }
            },
            fill: {
                type: 'pattern',
                opacity: 1,
                pattern: {
                enabled: true,
                style: ['verticalLines', 'squares', 'horizontalLines', 'circles', 'slantedLines'],
                },
            },
            states: {
                hover: {
                enabled: false
                }
            },
            theme: {
                palette: 'palette2'
            },
            title: {
                text: "Current Product Backlog Status"
            },
            responsive: [{
                breakpoint: 480,
                options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
                }
            }]
        },
      series: [ 23, 44, 15],
      labels: ['A', 'B', 'C', 'D', 'E']
    }
  }
  componentWillMount() {
    this.getStats();
  }
  
  getStats(){
    // console.log(this.props.Name)
    fetch('http://localhost:8000/projects/getStats/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({product_id: this.props.product_id})
    })
      .then(res => res.json())
      .then(json => {
       console.log(json);
       this.setState({series:json.data});
       console.log("This is sprint array" + this.state.series)
      });
  }


  render() {

    return (
      <div className="donut">
        <Chart options={this.state.options} series={this.state.series} type="donut" width="500" />
      </div>
    );
  }
}

export default ComplexDonut;