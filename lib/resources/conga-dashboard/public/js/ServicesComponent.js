import Vue from 'vue';

export default Vue.extend({

    template: `

        <div class="">

            <article class="message is-primary">
                <div class="message-body">
                    These are all of your application's registered services
                </div>
            </article>

            <p class="is-size-6"><strong>{{ total }}</strong> total registered services</p>

            <box v-for="(services, bundle) in bundles" :key="bundle">

                <span slot="header">{{ bundle }}</span>

                <span slot="body">
                    <table class="table small-text">
                        <thead>
                            <th>ID</th>
                            <th>Scope</th>
                            <th>Path</th>
                        </thead>
                        <tbody>
                            <tr v-for="service in services">
                                <td>{{ service.id }}</td>
                                <td>
                                    <span v-bind:class="[{ 'has-text-danger' : service.scope === 'request' }]">
                                        {{ service.scope }}
                                    </span>
                                </td>
                                <td>{{ service.path }}</td>
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
        this.$http.get('_conga/api/framework/services').then((response) => {
            this.total = response.body.total;
            this.bundles = response.body.bundles;
        }, (response) => {

        });
    }
});
