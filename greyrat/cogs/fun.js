const {SlashCommand, randint, shuffle} = require("../base.js");
const {
    open_bank,
    get_bank_data,
    update_bank,
    get_networth_lb,
} = require("../modules/bank_funcs.js");

const {EmbedBuilder, userMention} = require("discord.js");

const coinflip = new SlashCommand()
    .setName("giralamoneda")
    .setDescription("apuesta lanzando una moneda")
    .addStringOption((option) =>
        option
            .setName("apuesta")
            .setDescription("elija cara o cruz")
            .addChoices(
                {name: "cara", value: "heads"},
                {name: "cruz", value: "tails"}
            )
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName("monto")
            .setDescription("cuanto apuestas min:500 - max:5000")
            .setMinValue(500)
            .setMaxValue(5000)
            .setRequired(true)
    )
    .setDMPermission(false);
coinflip.callback(async (interaction) => {
    await interaction.deferReply();

    const user = interaction.user;
    const bet_on = interaction.options.getString("apuesta", true);
    const amount = interaction.options.getInteger("monto", true);

    await open_bank(user);
    const reward = Math.floor(amount / 2);
    const users = await get_bank_data(user);
    if (users[1] < amount)
        return await interaction.followUp("no tienes sufuciente dinero");

    let coin = ["heads", "tails"];
    const result = coin[randint(0, 1)];

    if (result !== bet_on) {
        await update_bank(user, -amount);
        return await interaction.followUp(`tejo ${result}, perdiste ${amount}`);
    }

    await update_bank(user, +reward);
    await interaction.followUp(`Exelente ${result}, ganaste ${amount + reward}`);
});

const slots = new SlashCommand()
    .setName("tragamonedas")
    .setDescription("gira las tragamonedas y obtén recompensas")
    .addIntegerOption((option) =>
        option
            .setName("monto")
            .setDescription("ingresa tu apuesta")
            .setMinValue(1000)
            .setMaxValue(10000)
            .setRequired(true)
    )
    .setDMPermission(false);
slots.callback(async (interaction) => {
    await interaction.deferReply();

    const user = interaction.user;
    const amount = interaction.options.getInteger("monto", true);

    await open_bank(user);
    if (!(amount >= 1000 && amount <= 10000))
        return await interaction.followUp(
            "Solo puedes apostar montos entre 1000 y 10000"
        );

    const users = await get_bank_data(user);
    if (users[1] < amount)
        return await interaction.followUp("no tienes plata");

    let slot1 = ["💝", "🎉", "💎", "💵", "💰", "🚀", "🍿"];
    let slot2 = ["💝", "🎉", "💎", "💵", "💰", "🚀", "🍿"];
    let slot3 = ["💝", "🎉", "💎", "💵", "💰", "🚀", "🍿"];
    const sep = " | ";
    const total = slot1.length;

    slot1 = shuffle(slot1);
    slot2 = shuffle(slot2);
    slot3 = shuffle(slot3);

    let mid;
    if (total % 2 === 0)
        // si incluso
        mid = Math.floor(total / 2);
    else mid = Math.floor((total + 1) / 2);

    const result = [];
    for (let x = 0; x < total; x++) result.push([slot1[x], slot2[x], slot3[x]]);

    const em = new EmbedBuilder().setDescription(
        "```" +
        `| ${result[mid - 1].join(sep)} |\n` +
        `| ${result[mid].join(sep)} | 📍\n` +
        `| ${result[mid + 1].join(sep)} |\n` +
        "```"
    );

    const slot = result[mid];
    const s1 = slot[0];
    const s2 = slot[1];
    const s3 = slot[2];

    let reward, content;
    if (s1 === s2 && s2 === s3 && s1 === s3) {
        reward = Math.floor(amount / 2);
        await update_bank(user, +reward);
        content = `Jackpot! ganaste ${amount + reward}`;
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        reward = Math.floor(amount / 4);
        await update_bank(user, +reward);
        content = `GG! solo ganaste ${amount + reward}`;
    } else {
        await update_bank(user, -amount);
        content = `perdiste ${amount}`;
    }

    await interaction.followUp({content: content, embeds: [em]});
});

const dice = new SlashCommand()
    .setName("dado")
    .setDescription("apuestale al dado")
    .addIntegerOption((option) =>
        option
            .setName("monto")
            .setDescription("ingresa un monto")
            .setMinValue(1000)
            .setMaxValue(5000)
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName("apuesta")
            .setDescription("ingrese un número de dados, Ejemplo: 6")
            .setMinValue(1)
            .setMaxValue(6)
            .setRequired(false)
    )
    .setDMPermission(false);
dice.callback(async (interaction) => {
    await interaction.deferReply();

    const user = interaction.user;
    const rdice = [1, 2, 3, 4, 5, 6];
    const amount = interaction.options.getInteger("monto", true);
    let bet_on = interaction.options.getInteger("apuesta", false);
    bet_on = bet_on || 6;

    const users = await get_bank_data(user);
    if (users[1] < amount)
        return await interaction.followUp(`no tienes ese dinero`);

    const rand_num = rdice[randint(0, rdice.length)];
    if (rand_num !== bet_on) {
        await update_bank(user, -amount);
        return await interaction.followUp(
            `salio ${rand_num}, perdiste ${amount}`
        );
    }

    const reward = Math.floor(amount / 2);
    await update_bank(user, +reward);
    await interaction.followUp(`salio ${rand_num}, ganaste ${amount + reward}`);
});

module.exports = {
    setup: () => {
        console.log(`- ${__filename.slice(__dirname.length + 1)}`);
    },
};
