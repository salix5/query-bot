import { ApplicationCommandType, ApplicationIntegrationType, ContextMenuCommandBuilder, InteractionContextType, MessageFlags } from 'discord.js';
export const module_url = import.meta.url;
export const data = new ContextMenuCommandBuilder()
	.setName('刪除訊息')
	.setType(ApplicationCommandType.Message)
	.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
	.setContexts([InteractionContextType.Guild, InteractionContextType.BotDM]);
export async function execute(interaction) {
	if (!interaction.targetMessage.interactionMetadata || interaction.targetMessage.interactionMetadata.user != interaction.user.id) {
		await interaction.reply({ content: '只能刪除自己發送的訊息。', flags: MessageFlags.Ephemeral })
		return;
	}
	await interaction.targetMessage.delete();
	await interaction.reply({ content: '訊息已刪除。', flags: MessageFlags.Ephemeral });
}
