import Vue from 'vue';

export default Vue.extend({

    template: `
        <div>

            <hero>

                <span slot="hero-title">Framework</span>
                <span slot="hero-subtitle">@conga-framework</span>

                <div class="container" slot="hero-foot">

                    <tab-container>
                        <tab route="framework" label="Services"></tab>
                        <tab route="framework.parameters" label="Parameters"></tab>
                        <tab route="bass.adapters" label="Event Listeners"></tab>
                    </tab-container>

                </div>

            </hero>

            <main-section>

                <div class="content">
                    <router-view></router-view>
                </div>

            </main-section>

        </div>
    `,

    components: {
        //'navbar-component': NavbarComponent
    }
});
