window.addEventListener('unhandledrejection', event => {
  console.error(event.reason);
});

function numberWithCommas(x) {
    if (!x) return;
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const database = fetch('/kenpc.json')
  .then(function(response) {
    return response.json()
  }).catch(function(ex) {
    console.log('parsing failed', ex)
  });

Vue.filter('date', value => moment(new Date(value)).format('MMMM YYYY'));
Vue.filter('number', value => numberWithCommas(value));

const KdpSelectChart = Vue.extend({
  template: `
    <div></div>
  `,
  props: ["database"],
  data: () => ({
  }),
  ready() {
    google.charts.load('current', {'packages':['corechart']});
  },
  watch: {
    'database': function(val, oldVal) {
      if (val) {
        google.charts.setOnLoadCallback(this.drawChart.bind(this));
      }
    }
  },
  methods: {
    drawChart() {
      if (!this.database) return;

      const chartData = [
        ["Month", "Per Page Payout"]
      ];
      const options = {
        vAxis: {
          format: 'currency'
        }
      };
      const formatter = new google.visualization.NumberFormat({
        prefix: '$',
        fractionDigits: 6
      });

      for(const date of Object.keys(this.database)) {
        chartData.push([new Date(date), this.database[date]]);
      }

      const chart = new google.visualization.LineChart(this.$el);
      const data = google.visualization.arrayToDataTable(chartData);

      formatter.format(data, 1);
      chart.draw(data, options);
    }
  }
});


const App = Vue.extend({
  template: `
    <div class='container main-info'>
      <h1>What's KDP Select paying these days?</h1>
      <h3>
        {{ lastKnownDate | date}}: \${{ lastKnownValue }}
        <span class='small'>per page</span>
      </h3>
      <p>How many page reads did you have that month?</p>
      <input type="number"
        v-model="pageReads"
        class="form-control page-reads"
        placeholder="A nice, round number" />
      <div v-if="pageReads > 0" transition="mad-money">
        <h2>
          {{pageReads | number}} pages at \${{ lastKnownValue }}...
        </h2>
        <h3>
          You should have made about {{madMonies | currency}}.
        </h3>
        <p>In the past, you would've made...</p>

        <table class='table table-striped table-bordered'>
          <thead>
            <tr>
              <th>Date</th>
              <th>Pages</th>
              <th>Gross ($)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="data in pastGross">
              <td>{{data.date | date}}</td>
              <td>\${{data.perPageAmount}}</td>
              <td>{{data.profit | currency}}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <kdp-select-chart :database="database" />
    </div>
  `,
  components: {
    'kdp-select-chart': KdpSelectChart
  },
  data: () => ({
    database: {},
    pageReads: null,
    pastGross: []
  }),
  computed: {
    lastKnownDate() {
      const dates = Object.keys(this.database);
      if (dates.length === 0) return;
      return dates[dates.length - 1];
    },
    lastKnownValue() {
      const lastKnownDate = this.lastKnownDate
      if (!lastKnownDate) return;
      return this.database[lastKnownDate];
    },
    madMonies() {
      if (!this.pageReads) return;
      if (!this.lastKnownValue) return;
      return this.pageReads * this.lastKnownValue;
    },
    pastGross() {
      if (!this.pageReads) return;
      const dates = Object.keys(this.database);
      const data = [];
      for(const date of dates) {
        const perPageAmount = this.database[date]

        data.push({
          date: date,
          perPageAmount: perPageAmount,
          profit: this.pageReads * perPageAmount
        });
      }
      return data;
    }
  },
  created() {
    database.then((database) => {
      // Convert date strings to actual date objects.
      const formattedData = {};
      for(const dateStr of Object.keys(database.dates)) {
        const date = new Date(dateStr);
        formattedData[date] = database.dates[dateStr];
      }
      this.database = formattedData;
    });
  }
});

const mountedApplication = new Vue({
  el: '#app',
  template: `<div><app /></div>`,
  components: {
    'app': App
  }
})
