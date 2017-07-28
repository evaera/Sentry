module.exports =
class Person {
	constructor(id) {
		this.id = id;
	}
	
	static async new(id) {
		let person = new Person(id);
		return await person.prepare();
	}
	
	async prepare() {
		this.user = await Sentry.bot.fetchUser(this.id);
		this.member = await Sentry.guild.fetchMember(this.user);
		return this;
	}
	
	async mute(reason, byWho) {
		let length = 30;
		
		this.member.addRole(process.env.MUTED_ROLE);
		this.user.send("You've been muted! 🖕");
	}
}