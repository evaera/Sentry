exports.chunkString = function (str, maxChars) {
    const iterations = Math.ceil(str.length / maxChars);
    const chunks = new Array(iterations);
    for (let i = 0, j = 0; i < iterations; ++i, j += maxChars) chunks[i] = str.substr(j, maxChars);
    return chunks;
};

exports.getLines = function (str) {
    return str.split(/\r\n|\r|\n/);
};

exports.getLines2 = function (str) {
    return exports.chunkString(str, 153);
};

function simplifyStr(str) {
    for (let i = 1; i < str.length; i++) {
        const num = str.length / i;
        const sub = str.substr(0, i);
        if (str == sub.repeat(num)) return [sub, num];
    }
    return [str, 1];
}

exports.isSpam = function (content) {
    if (exports.getLines2(content).length >= 500) return true;
    content = content.replace(/<(?:.|\n)*?>/gm, '<>');

    const pattern = /\S+/g;
    const matches = content.match(pattern);
    if (matches === null) return false;

    for (let i = 0; i < matches.length; i++) {
        // Util.log(`---${i + 1}---`);
        for (let j = 0; j < matches.length; j++) {
            let long = matches[j];
            if (j + i >= matches.length) continue;
            for (let k = 1; k <= i; k++) long += matches[j + k];
            // Util.log(long);
            const simpData = simplifyStr(long);
            const sub = simpData[0];
            const num = simpData[1];
            const subLength = sub.length;
            let triggered = false;
            if (num >= 3) {
                if (subLength == 1) { // 1 character, 100+ repetitions
                    if (num >= 100) triggered = true;
                } else if (subLength == 2) { // 2 characters, 20+ repetitions
                    if (num >= 20) triggered = true;
                } else if (subLength == 3) { // 3 characters, 7+ repetitions
                    if (num >= 7) triggered = true;
                } else if (subLength <= 5) { // 4-5 characters, 4+ repetitions
                    if (num >= 4) triggered = true;
                } else { // 6+ characters, 3+ repetitions
                    triggered = true;
                }
            }
            if (triggered) {
                return true;
            }
        }
    }

    return false;
};
