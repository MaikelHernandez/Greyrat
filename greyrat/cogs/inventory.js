const {SlashCommand} = require("../base.js");
const {
    open_bank,
    get_bank_data,
    update_bank,
} = require("../modules/bank_funcs.js");
const {
    shop_items,
    open_inv,
    get_inv_data,
    update_inv,
} = require("../modules/inventory_funcs.js");

const {EmbedBuilder, userMention} = require("discord.js");

const inventory = new SlashCommand()
    .setName("inventario")
    .setDescription("obtener su lista de artículos")
    .addUserOption((option) =>
        option
            .setName("miembro")
            .setDescription("objetivo @miembro")
            .setRequired(false)
    )
    .setDMPermission(false);
inventory.callback(async (interaction) => {
    await interaction.deferReply();

    const member = interaction.options.getUser("miembro", false);
    const user = member || interaction.user;
    if (user.bot) return await interaction.followUp("Los bot no tienen cuenta");

    await open_inv(user);

    const em = new EmbedBuilder().setColor(0x00ff00);
    let x = 1;
    for (const item of shop_items) {
        const name = item["name"];
        const item_id = item["id"];

        const data = await update_inv(user, 0, name);
        if (data[0] >= 1) {
            x += 1;
            em.addFields({
                name: `${name.toUpperCase()} - ${data[0]}`,
                value: `ID: ${item_id}`,
                inline: false,
            });
        }
    }

    em.setAuthor({
        name: `${user.username}inventario de`,
        iconURL: user.displayAvatarURL(),
    });
    if (x === 1) em.setDescription("Los artículos que compraste se muestran aquí...");

    await interaction.followUp({embeds: [em]});
});

const buy = new SlashCommand()
    .setName("comprar")
    .setDescription("comprar un artículo de la tienda")
    .addStringOption((option) =>
        option
            .setName("nombre_del_articulo")
            .setDescription("ingrese un nombre de artículo de la tienda")
            .setRequired(true)
    )
    .setDMPermission(false);
buy.callback(async (interaction) => {
    await interaction.deferReply();
    const user = interaction.user;
    const item_name = interaction.options
        .getString("nombre_del_articulo")
        .trim()
        .toLowerCase();

    await open_bank(user);
    if (!shop_items.map((item) => item.name.toLowerCase()).includes(item_name))
        return await interaction.followUp(
            `${userMention(user.id)} ningún artículo nombrado \`${item_name}\``
        );

    const users = await get_bank_data(user);
    for (const item of shop_items) {
        if (item_name === item.name.toLowerCase()) {
            if (users[1] < item.cost) {
                return await interaction.followUp(
                    `${userMention(
                        user.id
                    )} no tienes suficiente dinero para comprar ${item.name}`
                );
            }

            await open_inv(user);
            await update_inv(user, +1, item.name);
            await update_bank(user, -item.cost);
            return await interaction.followUp(
                `${userMention(user.id)} compraste ${item_name}`
            );
        }
    }
});

const sell = new SlashCommand()
    .setName("vender")
    .setDescription("obtener su lista de artículos")
    .addStringOption((option) =>
        option
            .setName("nombre_del_articulo")
            .setDescription("vender un artículo de su inventario")
            .setRequired(true)
    )
    .setDMPermission(false);
sell.callback(async (interaction) => {
    await interaction.deferReply();
    const user = interaction.user;
    const item_name = interaction.options
        .getString("nombre_del_articulo")
        .trim()
        .toLowerCase();
    await open_bank(user);

    if (!shop_items.map((item) => item.name.toLowerCase()).includes(item_name))
        return await interaction.followUp(
            `${userMention(user.id)} ningún artículo nombrado \`${item_name}\``
        );

    for (const item of shop_items) {
        if (item_name === item.name.toLowerCase()) {
            let cost = Math.round(item["cost"] / 4);
            const quantity = await update_inv(user, 0, item.name);
            if (quantity[0] < 1)
                return await interaction.followUp(
                    `${userMention(user.id)} no tienes ${
                        item.name
                    } en tú inventario`
                );

            await open_inv(user);
            await update_inv(user, -1, item.name);
            await update_bank(user, +cost);
            return await interaction.followUp(
                `${userMention(user.id)} as vendido ${item_name} por ${cost}`
            );
        }
    }
});

module.exports = {
    setup: () => {
        console.log(`- ${__filename.slice(__dirname.length + 1)}`);
    },
};
