import Vue from 'vue';

export default Vue.extend({

    template: `

        <div class="">

            <article class="message is-primary">
                <div class="message-body">
                    These are all of your application's registered routes
                </div>
            </article>

            <p class="is-size-6"><strong>{{ total }}</strong> total registered services</p>

            <box v-for="(routes, bundle) in bundles" :key="bundle">

                <span slot="header">{{ bundle }}</span>

                <span slot="body">
                    <table class="table small-text">
                        <thead>
                            <th>Method</th>
                            <th>URL</th>
                            <th>Controller</th>
                            <th>Action</th>
                        </thead>
                        <tbody>
                            <tr v-for="route in routes">
                                <td>{{ route.method }}
                                <td>{{ route.path }}</td>
                                <td></td>
                                <td>{{ route.action }}</td>
                            </tr>
                        </tbody>
                    </table>
                </span>

            </box>

        </div>

    `,

    data: function() {
        return {
            total: 0,
            bundles: {}
        }
    },

    created: function() {
        this.$http.get('_conga/api/framework/routes').then((response) => {
            this.total = response.body.total;
            this.bundles = response.body.bundles;
        }, (response) => {

        });
    }
});
