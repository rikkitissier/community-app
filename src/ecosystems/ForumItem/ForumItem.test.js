import React from "react";
import gql from "graphql-tag";
//import renderer from "react-test-renderer";
import { shallow, mount } from "enzyme";
import { MockedProvider } from "react-apollo/test-utils";
import ForumItem, { TestForumItem } from "./ForumItem";
import ForumItemFragment from "./ForumItemFragment";

const MarkForumRead = gql`
	mutation MarkForumRead($id: ID!) {
		mutateForums {
			markForumRead(id: $id) {
				...ForumItemFragment
			}
		}
	}
	${ForumItemFragment}
`;

const FORUM_DATA = {
	id: 1,
	name: "Test Forum",
	topicCount: 3,
	postCount: 5,
	hasUnread: true,
	passwordProtected: false,
	passwordRequired: false,
	isRedirectForum: false,
	redirectHits: 0,
	url: {
		full: "http://www.test.com"
	},
	lastPostAuthor: {
		photo: "https://via.placeholder.com/150"
	},
	lastPostDate: 1508115202
};

const MOCKS = [
	{
		request: {
			mutation: MarkForumRead,
			variables: {
				id: 1
			}
		},
		result: {
			data: {
				...FORUM_DATA,
				hasUnread: false
			}
		}
	}
];

describe("ForumItem component", () => {
	ForumItem.prototype.componentDidMount = jest.fn(e => e);
	const navigation = { navigate: jest.fn() };

	it("renders with data", () => {	
		const wrapper = shallow(<TestForumItem data={FORUM_DATA} />);
		expect(wrapper).toMatchSnapshot();
	});

	it("renders a loading state", () => {
		const wrapper = shallow(<TestForumItem loading={true} />);
		expect(wrapper.find('PlaceholderContainer').length).toBeGreaterThanOrEqual(1);
	});

	it("calls onPress (when supplied as a prop)", () => {
		const onPress = jest.fn();
		const wrapper = mount(<TestForumItem data={FORUM_DATA} onPress={onPress} />);

		wrapper.find('ContentRow').first().props().onPress();
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it("navigates to TopicList in default onPress handler", () => {
		const wrapper = shallow(<TestForumItem data={FORUM_DATA} navigation={navigation} />);
		wrapper.find('ContentRow').first().props().onPress();
		const navParams = navigation.navigate.mock.calls[0][0];

		expect(navParams.routeName).toBe('TopicList');
		expect(navParams.params).toHaveProperty('id', 1);
	});

	it("shows correct post count", () => {
		const wrapper = shallow(<TestForumItem data={FORUM_DATA} />);
		const postCount = wrapper.findWhere(n => n.prop('testId') === 'postCount').first();

		expect(postCount.prop('children').trim()).toBe('posts(8)');
	});

	it("does not show LastPostInfo for redirect forums", () => {
		const isRedirectData = {
			...FORUM_DATA,
			isRedirectForum: true
		};

		const wrapper = shallow(<TestForumItem data={isRedirectData} />);
		expect(wrapper.find('LastPostInfo').length).toBe(0);
	});

	it("has Mark Read swipeable button for normal forums", () => {
		TestForumItem.prototype.markForumRead = jest.fn();
		const wrapper = shallow(<TestForumItem data={FORUM_DATA} />);
		const rightButtons = wrapper.find('Swipeable').first().prop('rightButtons');
		const spy = jest.spyOn(TestForumItem.prototype, 'markForumRead');

		expect(rightButtons).toBeInstanceOf(Array);
		expect(rightButtons).toHaveLength(1);
		rightButtons[0].props.onPress();		
		expect(spy).toHaveBeenCalledTimes(1);
	});
});
