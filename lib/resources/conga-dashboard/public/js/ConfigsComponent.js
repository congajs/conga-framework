import Vue from 'vue';

export default Vue.extend({

    template: `

        <div class="">
            <article class="message is-primary">
                <div class="message-body">
                    These are all of your application's config objects
                </div>
            </article>
            <box v-for="(config, name) in configs" :key="name">
                <span slot="header">{{ name }}</span>
                <span slot="body">
                    <pre><code class="lang-json">{{ config }}</code></pre>
                </span>
            </box>
        </div>

    `,

    data: function() {
        return {
            configs: {}
        }
    },

    created: function() {
        this.$http.get('_conga/api/framework/configs').then((response) => {
            this.configs = response.body.configs;
        }, (response) => {

        });
    },

    updated: function() {
        window.hljs.initHighlighting.called = false;
        window.hljs.initHighlighting();
    }
});
