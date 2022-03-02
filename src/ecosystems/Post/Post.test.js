import React from "react";
import gql from "graphql-tag";
import { shallow, mount } from "enzyme";
import { MockedProvider } from "react-apollo/test-utils";
import Post, { TestPost } from "./Post";

const POST_DATA = {
	id: 1,
	url: {
		full: "http://www.test.com",
		app: "forums",
		module: "topic",
		controller: "topic"
	},
	timestamp: 1508115202,
	author: {
		id: 2,
		photo: "https://via.placeholder.com/150",
		name: "testadmin",
		isOnline: true
	},
	content: "<p>Praesent commodo cursus magna, vel scelerisque nisl consectetur et.</p>",
	isFirstPost: true,
	reputation: {
		canReact: true,
		hasReacted: true,
		canViewReps: true,
		isLikeMode: false,
		givenReaction: {
			id: 3,
			image: "https://via.placeholder.com/40",
			name: "GivenReaction"
		},
		defaultReaction: {
			id: 3,
			image: "https://via.placeholder.com/40",
			name: "Reaction"
		},
		availableReactions: [
			{
				id: 4,
				image: "https://via.placeholder.com/40",
				name: "Reaction 2"
			},
			{
				id: 5,
				image: "https://via.placeholder.com/40",
				name: "Reaction 3"
			}
		],
		reactions: [
			{
				id: 3,
				image: "https://via.placeholder.com/40",
				name: "Reaction",
				count: 1
			},
			{
				id: 4,
				image: "https://via.placeholder.com/40",
				name: "Reaction 2",
				count: 2
			},
			{
				id: 5,
				image: "https://via.placeholder.com/40",
				name: "Reaction 3",
				count: 3
			}
		]
	}
};

describe("Post component", () => {
	it("renders with data", () => {
		const wrapper = shallow(<TestPost data={POST_DATA} />);
		expect(wrapper).toMatchSnapshot();
	});

	it("renders a loading state", () => {
		const wrapper = shallow(<TestPost loading={true} />);
		expect(wrapper.find('PlaceholderContainer').length).toBeGreaterThanOrEqual(1);
	});

	it("renders correct number of reactions", () => {
		const wrapper = shallow(<TestPost data={POST_DATA} />);
		const reactionList = wrapper.findWhere(n => n.prop('testId') === 'reactionList').first();
		const reactions = reactionList.find('Reaction');

		expect(reactions).toHaveLength(3);
		expect(reactions.at(0).prop('count')).toBe(1);
		expect(reactions.at(1).prop('count')).toBe(2);
		expect(reactions.at(2).prop('count')).toBe(3);
	});

	it("renders a reply button only when permission exists", () => {
		const canReplyWrapper = shallow(<TestPost data={POST_DATA} canReply={true} />);
		const canReplyButton = canReplyWrapper.findWhere(n => n.prop('testId') === 'replyButton');
		const cannotReplyWrapper = shallow(<TestPost data={POST_DATA} canReply={false} />);
		const cannotReplyButton = cannotReplyWrapper.findWhere(n => n.prop('testId') === 'replyButton');

		expect(canReplyButton).toHaveLength(1);
		expect(cannotReplyButton).toHaveLength(0);
	});

	it("renders a reputation button (when permission exists)", () => {
		const canReactWrapper = shallow(<TestPost data={POST_DATA} />);
		const canReactButton = canReactWrapper.findWhere(n => n.prop('testId') === 'repButton');
		const cannotReactData = {
			...POST_DATA,
			reputation: {
				...POST_DATA.reputation,
				canReact: false
			}
		};
		const cannotReactWrapper = shallow(<TestPost data={cannotReactData} />);
		const cannotReactButton = cannotReactWrapper.findWhere(n => n.prop('testId') === 'repButton');

		expect(canReactButton).toHaveLength(1);
		expect(cannotReactButton).toHaveLength(0);
	});

	it("renders a reputation button showing the user's given reaction", () => {
		const wrapper = shallow(<TestPost data={POST_DATA} />);
		const reactButton = wrapper.findWhere(n => n.prop('testId') === 'repButton');

		expect(reactButton.prop('label')).toBe('GivenReaction');
		expect(reactButton.prop('image')).toBe('https://via.placeholder.com/40');
	});

	it("shows who gave a reaction (when permission exists)", () => {
		const spy = jest.spyOn(TestPost.prototype, 'onPressReaction');
		const wrapper1 = shallow(<TestPost data={POST_DATA} />);
		const reaction1 = wrapper1.find('Reaction').at(0);
		reaction1.props().onPress();
		expect(spy).toHaveBeenCalledTimes(1);
		
		const noViewRepData = {
			...POST_DATA,
			reputation: {
				...POST_DATA.reputation,
				canViewReps: false
			}
		};

		const wrapper2 = shallow(<TestPost data={noViewRepData} />);
		const reaction2 = wrapper2.find('Reaction').at(0);
		expect(reaction2.prop('onPress')).toBeNull();
	});

	it("navigates to Profile screen only when not a guest post", () => {
		const navigation = { navigate: jest.fn() };
		const wrapper1 = shallow(<TestPost data={POST_DATA} navigation={navigation} />);
		const postAuthor1 = wrapper1.findWhere(n => n.prop('testId') === 'postAuthor');
		postAuthor1.find('TouchableOpacity').first().props().onPress();
		const navParams = navigation.navigate.mock.calls[0];

		expect(navParams[0]).toBe('Profile');
		expect(navParams[1]).toHaveProperty('id', 2);

		const guestPost = {
			...POST_DATA,
			author: {
				...POST_DATA.author,
				id: 0
			}
		};

		const wrapper2 = shallow(<TestPost data={guestPost} navigation={navigation} />);
		const postAuthor2 = wrapper2.findWhere(n => n.prop('testId') === 'postAuthor');

		expect(postAuthor2.find('TouchableOpacity').first().prop('onPress')).toBeNull();
	});
});