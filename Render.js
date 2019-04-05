// Load the Visualization API and the corechart package.
google.charts.load('current', {'packages':['corechart']});

// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(drawChart);

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawChart() {

  var unit = { 
    models: parseInt(document.getElementById("models").value), 
    ranks: parseInt(document.getElementById("ranks").value), 
    toughness: parseInt(document.getElementById("toughness").value), 
    wardSave: parseInt(document.getElementById("wardSave").value), 
    armorSave: parseInt(document.getElementById("armorSave").value), 
    wounds: parseInt(document.getElementById("wounds").value) }

  var toHit = parseInt(document.getElementById("toHit").value);

  // Create the data table.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Wounds');
  data.addColumn('number', 'Repeating Shots');
  data.addColumn('number', 'Single Shot')

  var rows = []

  var repeating = repeatingShots(toHit, unit);
  var single = singleShot(toHit, unit);

  document.getElementById("mean_multi").innerHTML = repeating.mean().toFixed(2);
  document.getElementById("mean_single").innerHTML = single.mean().toFixed(2);

  for (var i = 1; i <= 6; i++) {
    rows.push(['' + i + '+', repeating.probability(geq(i)).valueOf(), single.probability(geq(i)).valueOf()]);
  }

  data.addRows(rows);

  // Set chart options
  var options = {
    width: 700,
    height: 400,
    vAxis: {
      format: 'percent',
      minValue: 0,
      maxValue: 1,
      title: "Probability"
    },
    hAxis: {
      title: "Unsaved Wounds Caused"
    },
    legend: 'bottom',
  };

  // Instantiate and draw our chart, passing in some options.
  var chart = new google.visualization.ColumnChart(document.getElementById('chart'));
  chart.draw(data, options);
}

window.onload = function() {
  var inputs = document.getElementsByTagName("select");
  for (i = 0; i < inputs.length; i++) {
    inputs[i].onchange = drawChart;
  }

  inputs = document.getElementsByTagName("input");
  for (i = 0; i < inputs.length; i++) {
    inputs[i].onchange = drawChart;
  }
}