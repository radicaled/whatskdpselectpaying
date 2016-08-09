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

const app = new Vue({
  el: '#app',
  template: `
    <div class='container main-info'>      
      <h1>What's KDP Select paying these days?</h1>
      <h3>{{ lastKnownDate | date}}: \${{ lastKnownValue }}</h3>
      <p>How many page reads did you have that month?</p>
      <input type="number"
        v-model="pageReads"
        placeholder="A nice, round number" />
      <div v-if="pageReads > 0" transition="mad-money">
        <h2>
          {{pageReads | number}} pages at \${{ lastKnownValue }}...
        </h2>
        <h3>
          You would have made about {{madMonies | currency}}.
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
    </div>
  `,
  data: {
    database: {},
    pageReads: null,
    pastGross: []
  },
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
