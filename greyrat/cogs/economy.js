const {SlashCommand, randint} = require("../base.js");
const {open_bank, update_bank} = require("../modules/bank_funcs.js");

const {EmbedBuilder, userMention} = require("discord.js");

const daily = new SlashCommand()
    .setName("diario")
    .setDescription("Ganas una recompensa diaria")
    .setDMPermission(false)
    .setCooldown(24 * 3600);
daily.callback(async (interaction) => {
    await interaction.deferReply();
    const user = interaction.user;
    await open_bank(user);

    let rand_amt = randint(3000, 5000);
    await update_bank(user, +rand_amt);
    await interaction.followUp(
        `${userMention(user.id)} tu recompensa diaria es ${rand_amt}`
    );
});

const weekly = new SlashCommand()
    .setName("semanal")
    .setDescription("ganas una recompensa semanal")
    .setDMPermission(false)
    .setCooldown(7 * 24 * 3600);
weekly.callback(async (interaction) => {
    await interaction.deferReply();
    const user = interaction.user;
    await open_bank(user);

    let rand_amt = randint(7000, 10000);
    await update_bank(user, +rand_amt);
    await interaction.followUp(
        `${userMention(user.id)} tu recompensa semanal es ${rand_amt}`
    );
});

const monthly = new SlashCommand()
    .setName("mensual")
    .setDescription("ganas una recompensa mensual")
    .setDMPermission(false)
    .setCooldown(30 * 24 * 3600);
monthly.callback(async (interaction) => {
    await interaction.deferReply();
    const user = interaction.user;
    await open_bank(user);

    let rand_amt = randint(30000, 50000);
    await update_bank(user, +rand_amt);
    await interaction.followUp(
        `${userMention(user.id)} tu recompensa mensual es ${rand_amt}`
    );
});

module.exports = {
    setup: () => {
        console.log(`- ${__filename.slice(__dirname.length + 1)}`);
    },
};
