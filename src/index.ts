import * as fs from "fs";
import * as path from "path";

const USERNAME = "хомка";
const FILENAME = "result";

type message = {
    id: number;
    date: Date;
    from: string;
    from_id: string;
    type: string;
    text: string;
    text_entities: { type: "plain"; text: string }[];
    photo: string;
    media_type?: "sticker";
};

type userStat = {
    username: string;
    id: string;
    count_char: number;
    count_msg: number;
    count_photo: number;
    count_sticker: number;
    messChar: number;
};

type messageFormat = {
    from: string;
    from_id: string;
    text: string;
    isHavePhoto: boolean;
    isHaveSticker: boolean;
};

function getMessagesFromFile(filename: string) {
    const jsonFile = fs.readFileSync(path.resolve(`src/${filename}.json`));
    const json: Array<message> = JSON.parse(jsonFile.toString());
    return json.filter((o) => o.type === "message");
}

function formatMessages(messages: message[]): messageFormat[] {
    const msgPlains = messages.map((msg) => {
        return {
            ...msg,
            text_entities: msg.text_entities.filter(
                (plain) => plain.type === "plain"
            ),
        };
    });
    const msgsText = msgPlains.map((msg) => {
        let isHavePhoto = false;
        let isHaveSticker = false;
        if (msg.photo) {
            isHavePhoto = true;
        }
        if (msg.media_type === "sticker") {
            isHaveSticker = true;
        }
        return {
            from: msg.from,
            from_id: msg.from_id,
            text: msg.text_entities.map((ent) => ent.text).join(" "),
            isHavePhoto: isHavePhoto,
            isHaveSticker: isHaveSticker,
        };
    });
    return msgsText;
}

function getUserStats(messages: messageFormat[]): userStat[] {
    let userStats: userStat[] = [];
    messages.forEach((msg) => {
        const candidate = userStats.find((user) => user.id === msg.from_id);
        if (!candidate) {
            userStats.push({
                id: msg.from_id,
                username: msg.from,
                count_msg: 1,
                count_char: msg.text.length,
                count_photo: msg.isHavePhoto ? 1 : 0,
                count_sticker: msg.isHaveSticker ? 1 : 0,
                messChar: 0,
            });
        } else {
            candidate.count_char += msg.text.length;
            candidate.count_msg += 1;
            candidate.count_photo += msg.isHavePhoto ? 1 : 0;
            candidate.count_sticker += msg.isHaveSticker ? 1 : 0;
        }
    });
    return userStats;
}

function addMesCharStat(users: userStat[]): userStat[] {
    return users.map((user) => {
        let sum = false;
        if (user.count_msg > 200) {
            sum = true;
        }
        return {
            ...user,
            messChar: sum
                ? parseFloat((user.count_char / user.count_msg).toFixed(2))
                : 0,
        };
    });
}

function sortUserStats(
    userStats: userStat[],
    filter:
        | "count_char"
        | "count_msg"
        | "count_photo"
        | "count_sticker"
        | "messChar"
): userStat[] {
    return userStats.sort((a, b) => {
        return b[filter] - a[filter];
    });
}

function createStatsData(
    field:
        | "count_char"
        | "count_msg"
        | "count_photo"
        | "count_sticker"
        | "messChar"
) {
    const messagesRaw = getMessagesFromFile(FILENAME);
    const messages = formatMessages(messagesRaw);
    const userStats = addMesCharStat(getUserStats(messages));
    const userStatsSorted = sortUserStats(userStats, field);
    console.log(
        userStatsSorted
            .slice(0, 100)
            .map(
                (st) =>
                    `Username: ${st.username} count_msg: ${st.count_msg} count_char: ${st.count_char}`
            )
            .join("\n")
    );
    console.log('\nНИКИ:\n')
    console.log(
        userStatsSorted
            .slice(0, 100)
            .map((st) => st.username)
            .join("\n")
    );
    console.log('\nКОЛИЧЕСТВО:\n')
    console.log(
        userStatsSorted
            .slice(0, 100)
            .map((st) => st[field])
            .join("\n")
    );
}

function createWordsData() {
    let words: any = {};
    const messagesRaw = getMessagesFromFile(FILENAME);
    const messages = formatMessages(messagesRaw);
    messages.forEach((msg) => {
        msg.text
            .toLowerCase()
            .match(/[а-яА-Яa-zA-Z0-9ё_]+/gu)
            ?.forEach((word) => {
                if (words[word] !== undefined) {
                    words[word] = words[word] + 1;
                } else {
                    words[word] = 1;
                }
            });
    });

    // console.log("filtering...");
    // words = words.filter((w) => w.count > 2000);
    // console.log("sorting...", words.length);
    // words = words.sort((a, b) => b.count - a.count);
    // console.log("mapping...");
    // words = words.map((word, i) => {
    //   return { id: i, ...word };
    // });

    return words;
}

createStatsData("count_msg");
// const words = createWordsData();
// console.log(Object.entries(words).length);
// let w = Object.entries(words)
//   .filter((obj) => obj[1] > 100)
//   .sort((a, b) => b[1] - a[1])
//   .slice(0, 5000);

// const ww = w.map((www, id) => {
//   return { id, word: www[0], count: www[1] };
// });

// ww.forEach((wwww) => console.log(wwww.word));
// fs.writeFileSync("words.json", JSON.stringify(ww));
