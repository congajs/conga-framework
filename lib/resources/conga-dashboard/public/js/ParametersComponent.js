import Vue from 'vue';

export default Vue.extend({

    template: `

        <div class="">

            <article class="message is-primary">
                <div class="message-body">
                    These are all of your application's parameters
                </div>
            </article>

            <p class="is-size-6"><strong>{{ total }}</strong> total parameters</p>


            <table class="table small-text">
                <thead>
                    <th>Name</th>
                    <th>Value</th>
                </thead>
                <tbody>
                    <tr v-for="(value, key) in parameters">
                        <td>{{ key }}</td>
                        <td>{{ value }}</td>
                    </tr>
                </tbody>
            </table>

        </div>

    `,

    data: function() {
        return {
            total: 0,
            parameters: {}
        }
    },

    created: function() {
        this.$http.get('_conga/api/framework/parameters').then((response) => {
            this.total = response.body.total;
            this.parameters = response.body.parameters;
        }, (response) => {

        });
    }
});
