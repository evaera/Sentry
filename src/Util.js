module.exports = {
    time() {
        return (new Date()).getTime();
    },

    sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    },
    
    IsValidAdvert(text) {
        let matches = text.match(/http(?:s)?:\/\/(?:[\w-]+\.)*([\w-]{1,63}(?:\.(?:\w{3}|\w{2})))(?:$|\/)/i);
        
        let hasRobloxLink = false;
        if (matches) {
            for (let match of matches) {
                if (matches.indexOf(match) === 0) continue;
                if (match !== "roblox.com") {
                    return false;
                } else {
                    hasRobloxLink = true;
                }
            }
        } else {
            return false;
        }
        
        return hasRobloxLink;
    }
}