const {SlashCommand} = require("../base.js");
const {
    open_bank,
    get_bank_data,
    update_bank,
    get_networth_lb,
} = require("../modules/bank_funcs.js");

const {EmbedBuilder, userMention} = require("discord.js");

const balance = new SlashCommand()
    .setName("balance")
    .setDescription("obtener saldo bancario")
    .addUserOption((option) =>
        option
            .setName("miembro")
            .setDescription("objetivo @miembro")
            .setRequired(false)
    )
    .setDMPermission(false);
balance.callback(async (interaction) => {
    await interaction.deferReply();
    const member = interaction.options.getUser("miembro", false);
    const user = member || interaction.user;
    if (user.bot) return await interaction.followUp("Los bot no tienen cuenta");
    await open_bank(user);

    const users = await get_bank_data(user);
    const wallet_amt = users[1];
    const bank_amt = users[2];
    let net_amt = wallet_amt + bank_amt;

    const em = new EmbedBuilder()
        .setAuthor({name: user.username, iconURL: user.displayAvatarURL()})
        .setDescription(
            `Billetera: ${wallet_amt}\n` +
            `Banco: ${bank_amt}\n` +
            `total: ${net_amt}`
        )
        .setColor(0x00ff00);

    await interaction.followUp({embeds: [em]});
});

const withdraw = new SlashCommand()
    .setName("retirar")
    .setDescription("retira tu dinero del banco")
    .addStringOption((option) =>
        option
            .setName("monto")
            .setDescription("ingrese la cantidad, 'todo' o 'max'")
            .setRequired(true)
    )
    .setDMPermission(false);
withdraw.callback(async (interaction) => {
    await interaction.deferReply();
    const user = interaction.user;
    let amount = interaction.options.getString("monto");

    const users = await get_bank_data(user);
    const bank_amt = users[2];
    if (["all", "max"].includes(amount.toLowerCase())) {
        await update_bank(user, +bank_amt);
        await update_bank(user, -bank_amt, "bank");

        return await interaction.followUp(
            `${userMention(user.id)} retiraste ${bank_amt} en tu billetera`
        );
    }

    amount = parseInt(amount);
    if (amount > bank_amt)
        return await interaction.followUp(
            `${userMention(user.id)} ¡No tienes suficiente dinero!`
        );
    if (amount < 0)
        return await interaction.followUp(
            `${userMention(user.id)} ¡Ingrese una cantidad válida!`
        );

    await update_bank(user, +amount);
    await update_bank(user, -amount, "bank");
    await interaction.followUp(
        `${userMention(user.id)} retiraste ${amount} de tu banco`
    );
});

const deposit = new SlashCommand()
    .setName("deposito")
    .setDescription("depositar dinero en el banco")
    .addStringOption((option) =>
        option
            .setName("monto")
            .setDescription("ingrese la cantidad, 'todo' o 'max'")
            .setRequired(true)
    )
    .setDMPermission(false);
deposit.callback(async (interaction) => {
    await interaction.deferReply();
    const user = interaction.user;
    let amount = interaction.options.getString("monto");

    const users = await get_bank_data(user);
    const wallet_amt = users[1];
    if (["all", "max"].includes(amount.toLowerCase())) {
        await update_bank(user, -wallet_amt);
        await update_bank(user, +wallet_amt, "bank");

        return await interaction.followUp(
            `${userMention(user.id)} depositaste ${wallet_amt} en tu banco`
        );
    }

    amount = parseInt(amount);
    if (amount > wallet_amt)
        return await interaction.followUp(
            `${userMention(user.id)} no tienes suficiente dinero`
        );
    if (amount < 0)
        return await interaction.followUp(
            `${userMention(user.id)} ingrese una cantidad válida!`
        );

    await update_bank(user, -amount);
    await update_bank(user, +amount, "bank");
    await interaction.followUp(
        `${userMention(user.id)} depositaste ${amount} en tu banco`
    );
});

const send = new SlashCommand()
    .setName("transferir")
    .setDescription("enviar dinero a un miembro")
    .addUserOption((option) =>
        option
            .setName("miembro")
            .setDescription("objetivo @miembro")
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName("monto")
            .setDescription("caunto vas a tranferir?")
            .setRequired(true)
    )
    .setDMPermission(false);
send.callback(async (interaction) => {
    await interaction.deferReply();

    const user = interaction.user;
    const member = interaction.options.getUser("miembro", true);
    const amount = interaction.options.getInteger("monto", true);
    if (member.bot)
        return await interaction.followUp("Los bot no tienen cuenta");

    const users = await get_bank_data(user);
    const wallet_amt = users[1]
    if (amount <= 0) return await interaction.followUp("¡Ingrese una cantidad válida!");
    if (amount > wallet_amt)
        return await interaction.followUp("No tienes suficiente dinero");

    await update_bank(user, -amount);
    await update_bank(member, +amount);
    await interaction.followUp(
        `enviaste ${amount} a ${userMention(member.id)}`
    );
});

const leaderboard = new SlashCommand()
    .setName("leaderboard")
    .setDescription("mira a las personas mas ricas del server");
leaderboard.callback(async (interaction) => {
    await interaction.deferReply();

    const guild = interaction.guild;
    const users = await get_networth_lb();
    let data = [];
    let index = 1;
    for (const member of users) {
        if (index > 10) break;

        let member_name = (
            await interaction.client.users.fetch(member[0].toString())
        )?.tag;
        if (member_name === undefined) continue;

        const member_amt = member[1];
        if (index === 1) data.push(`**🥇 \`${member_name}\` -- ${member_amt}**`);
        if (index === 2) data.push(`**🥈 \`${member_name}\` -- ${member_amt}**`);
        if (index === 3) data.push(`**🥉 \`${member_name}\` -- ${member_amt}**`);
        if (index >= 4)
            data.push(`**${index} \`${member_name}\` -- ${member_amt}**`);
        index += 1;
    }

    const msg = data.join("\n");
    const em = new EmbedBuilder()
        .setTitle(`Top ${index} usuarios mas ricos`)
        .setDescription(
            "Se basa en el patrimonio (billetera + banco) de usuarios globales\n\n" + mensaje
        )
        .setColor(0x00ff00)
        .setTimestamp()
        .setFooter({text: `GLOBAL - ${guild.name}`});
    await interaction.followUp({embeds: [em]});
});

module.exports = {
    setup: () => {
        console.log(`- ${__filename.slice(__dirname.length + 1)}`);
    },
};
