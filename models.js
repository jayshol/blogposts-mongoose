'use strict'

const mongoose = require('mongoose');

const blogpostSchema = mongoose.Schema({
	title : {type:String, required: true},
	content : {type:String, required: true},
	author:{
		firstName:String,
		lastName:String
	},
	created:{type:Date}
});

blogpostSchema.virtual('authorName').get(function() {
	return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogpostSchema.methods.serialize = function(){

	return {
		title: this.title,
		content: this.content,
		author: this.authorName,
		created: this.created
	};
}

const BlogPost = mongoose.model('BlogPost', blogpostSchema);

module.exports = {BlogPost};