module.exports = {
    time() {
        return (new Date()).getTime();
    },

    sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}