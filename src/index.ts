import { create } from "domain";
import * as fs from "fs";
import * as path from "path";

const USERNAME = "хомка";
const FILENAME = "result";

type reaction_custom_emoji = {
    type: "custom_emoji";
    document_id: string;
    count: number;
    recent: { from: string; from_id: string; date: Date }[];
};

type reaction_emoji = {
    type: "emoji";
    emoji: string;
    count: number;
    recent: { from: string; from_id: string; date: Date }[];
};

type reaction = reaction_custom_emoji | reaction_emoji;

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
    reactions?: reaction[];
};

type messageFormat = {
    from: string;
    from_id: string;
    text: string;
    isHavePhoto: boolean;
    isHaveSticker: boolean;
    date?: Date;
    reactions?: reaction[];
};

type userStat = {
    username: string;
    id: string;
    count_char: number;
    count_msg: number;
    count_photo: number;
    count_sticker: number;
    messChar: number;
    reactions_get: Map<string, number>;
};

function getMessagesFromFile(filename: string): message[] {
    const jsonFile = fs.readFileSync(path.resolve(`src/${filename}.json`));
    const json: Array<message> = JSON.parse(jsonFile.toString());
    return json.filter((o) => o.type === "message");
}

function formatMessages(messages: message[]): messageFormat[] {
    const msgPlains = messages.map((msg) => {
        const text_entities = msg.text_entities.filter((plain) => plain.type === "plain");

        return { ...msg, text_entities };
    });

    const msgsText = msgPlains.map((msg) => {
        const { from, from_id } = msg;
        const text = msg.text_entities.map((ent) => ent.text).join(" ");
        const isHavePhoto = Boolean(msg.photo);
        const isHaveSticker = msg.media_type === "sticker";
        const date = new Date(msg.date);
        const reactions = msg.reactions;

        return { from, from_id, text, isHavePhoto, isHaveSticker, date, reactions };
    });

    return msgsText;
}

function getUserStats(messages: messageFormat[]): userStat[] {
    let userStats: userStat[] = [];

    messages.forEach((msg) => {
        const candidate = userStats.find((user) => user.id === msg.from_id);

        if (!candidate) {
            const reactions_get = new Map<string, number>();
            msg.reactions?.forEach((r) => {
                if (r.type == "custom_emoji") return;

                const count = reactions_get.get(r.emoji);
                if (!count) {
                    reactions_get.set(r.emoji, r.count);
                    return;
                }

                reactions_get.set(r.emoji, count + r.count);
            });

            userStats.push({
                id: msg.from_id,
                username: msg.from,
                count_msg: 1,
                count_char: msg.text.length,
                count_photo: msg.isHavePhoto ? 1 : 0,
                count_sticker: msg.isHaveSticker ? 1 : 0,
                messChar: 0,
                reactions_get,
            });

            return;
        }

        candidate.count_char += msg.text.length;
        candidate.count_msg += 1;
        candidate.count_photo += msg.isHavePhoto ? 1 : 0;
        candidate.count_sticker += msg.isHaveSticker ? 1 : 0;
        msg.reactions
            ?.filter((r) => r.type == "emoji")
            .forEach((r) => {
                if (r.type == "emoji") {
                    const count = candidate.reactions_get.get(r.emoji);
                    if (!count) {
                        candidate.reactions_get.set(r.emoji, r.count);
                        return;
                    }

                    candidate.reactions_get.set(r.emoji, count + r.count);
                }
            });
        // console.log(candidate.reactions_get);
    });

    return userStats;
}

function addMesCharStat(users: userStat[]): userStat[] {
    return users.map((user) => {
        if (user.count_msg < 200) return { ...user, messChar: 0 };

        return {
            ...user,
            messChar: parseFloat((user.count_char / user.count_msg).toFixed(2)),
        };
    });
}

function sortUserStats(
    userStats: userStat[],
    filter: "count_char" | "count_msg" | "count_photo" | "count_sticker" | "messChar" | "reactions"
): userStat[] {
    return userStats.sort((a, b) => {
        if (filter == "reactions") {
            const sum = (r: userStat) => Array.from(r.reactions_get.values()).reduce((acc, c) => acc + c, 0);
            return sum(b) - sum(a);
        }

        return b[filter] - a[filter];
    });
}

function createStatsData(
    field: "count_char" | "count_msg" | "count_photo" | "count_sticker" | "messChar" | "reactions",
    rzachka: boolean = false
) {
    const messagesRaw = getMessagesFromFile(FILENAME);
    const messages = formatMessages(messagesRaw);
    const userStats = addMesCharStat(getUserStats(messages));
    const userStatsSorted = sortUserStats(userStats, field);
    const userStatsSortedSliced = userStatsSorted.slice(0, 100);

    if (field === "reactions") {
        console.log("Топ три полученных реакций 10.08.2024 - 21.10.2024\n");

        let result: { username: string; reactions: { emoji: string; count: number }[] }[] = [];
        userStatsSorted.forEach((us) => {
            result.push({
                username: us.username,
                reactions: Array.from(us.reactions_get)
                    .filter((a) => {
                        if (rzachka) {
                            return a[0] == "😁";
                        } else {
                            return true;
                        }
                    })
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map((e) => Object({ emoji: e[0], count: e[1] })),
            });
        });
        result = result
            .filter((r) => r.reactions.length > 0)
            .sort((a, b) => b.reactions[0].count - a.reactions[0].count);
        console.table(
            result.map((r) => Object({ ...r, reactions: r.reactions.map((e) => `[${e.emoji} ${e.count}]`) }))
        );
        result.forEach((r) => {
            console.table([`${r.username}:`, `${r.reactions.map((e) => `[${e.emoji} ${e.count}]`).join(" ")}`]);
        });

        return;
    }

    const userStatToString = (st: userStat) =>
        `Username: ${st.username} count_msg: ${st.count_msg} count_char: ${st.count_char}`;

    console.log(userStatsSortedSliced.map(userStatToString).join("\n"));

    console.log("\nНИКИ:\n");
    console.log(userStatsSortedSliced.map((st) => st.username).join("\n"));

    console.log("\nКОЛИЧЕСТВО:\n");
    console.log(userStatsSortedSliced.map((st) => st[field]).join("\n"));
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

    return words;
}

function statsByPervs() {
    type messageFormatMarked = messageFormat & {
        perv: boolean;
    };

    const tgMsgs = getMessagesFromFile("result");
    const msgs = formatMessages(tgMsgs);

    const users = new Map<string, string>();
    msgs.forEach((it) => {
        if (!users.has(it.from_id)) users.set(it.from_id, it.from);
    });

    const idsString = Array.from(users.keys())
        .map((it) => `'${it}'`)
        .join(",");

    // console.log(users)
    // console.log(idsString)

    const not_perv = [
        "user814586622",
        "user1614269527",
        "user463981762",
        "user227964061",
        "user389198971",
        "user1147185372",
        "user1116508724",
        "user625777584",
        "user421568075",
        "user865264074",
        "user1468781048",
        "user542914289",
        "user1703358344",
        "user383152289",
        "user1752687551",
        "user1667806547",
        "user713209953",
        "user856062306",
        "user528097933",
        "user881837799",
    ];

    // const not_perv = [
    //   "user421568075",
    //   "user5577844834",
    //   "user1147185372",
    //   "user1028278252",
    //   "user834594571",
    //   "user964997951",
    //   "user714735633",
    //   "user746854520",
    //   "user1319897461",
    //   "user881837799",
    //   "user1752687551",
    //   "user510449525",
    //   "user1346110354",
    //   "user383152289",
    //   "user419505706",
    //   "user720516620",
    //   "user624950303",
    //   "user606683187",
    //   "user6660283064",
    //   "user5705139370",
    //   "user865562988",
    //   "user453448386",
    //   "user528097933",
    //   "user722146218",
    //   "user463981762",
    //   "user625777584",
    //   "user1667806547",
    //   "user645018727",
    //   "user483039996",
    // ];

    const msgsMarked: messageFormatMarked[] = msgs.map((it) => {
        return { ...it, perv: !not_perv.includes(it.from_id) };
    });

    const msgsFromNotPervs = msgs.filter((it) => !not_perv.includes(it.from_id));

    const groupsObject: { [date: string]: messageFormatMarked[] } = msgsMarked.reduce((groups: any, msg) => {
        const date = msg.date?.toISOString().split("T")[0];
        if (!date) return;

        if (!groups[date]) groups[date] = [];

        groups[date].push(msg);
        return groups;
    }, {});

    const groups = Object.keys(groupsObject).map((date) => {
        return {
            date,
            msgs: groupsObject[date],
        };
    });

    const countPervMsgs = (msgs: messageFormatMarked[]): number => {
        return msgs.filter((it) => it.perv).length;
    };

    const groupsCountPerv = groups.map((group) => {
        const countPerv = countPervMsgs(group.msgs);

        return {
            date: group.date,
            countPerv,
            countNotPerv: group.msgs.length - countPerv,
        };
    });

    const sliceCount = 20;

    const groupsCountPervSlices = groupsCountPerv.slice(0, sliceCount);

    console.log(groupsCountPervSlices.map((it) => `${it.date}`).join(","));
    console.log(groupsCountPervSlices.map((it) => `${it.countPerv}`).join(","));
    console.log(groupsCountPervSlices.map((it) => `${it.countNotPerv}`).join(","));
}

if (process.argv[2] === "--perv") {
    statsByPervs();
} else if (process.argv[2] === "--reaction") {
    createStatsData("reactions");
} else if (process.argv[2] == "--rzhachka") {
    createStatsData("reactions", true);
} else {
    createStatsData("count_msg");
}
