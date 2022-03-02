import React from "react";
//import renderer from "react-test-renderer";
import { shallow } from "enzyme";
import UserPhoto from "../UserPhoto";
import { styleVars } from "../../styles";

const URI_IMAGE = "https://via.placeholder.com/150";
const SVG_IMAGE = "data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 1024 1024%22 style%3D%22background%3A%239662c4%22%3E%3Cg%3E%3Ctext text-anchor%3D%22middle%22 dy%3D%22.35em%22 x%3D%22512%22 y%3D%22512%22 fill%3D%22%23ffffff%22 font-size%3D%22700%22 font-family%3D%22-apple-system%2C BlinkMacSystemFont%2C Roboto%2C Helvetica%2C Arial%2C sans-serif%22%3ET%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E";

describe("UserPhoto component", () => {
	it("renders a URL image", () => {	
		const wrapper = shallow(<UserPhoto url={URI_IMAGE} />);
		expect(wrapper).toMatchSnapshot();
	});

	it("renders an SVG image", () => {
		const wrapper = shallow(<UserPhoto url={SVG_IMAGE} />);
		expect(wrapper).toMatchSnapshot();
	});

	it("renders at the specified size", () => {
		const wrapper = shallow(<UserPhoto url={URI_IMAGE} size={15} />);
		const image = wrapper.findWhere(n => n.prop('testId') === 'userPhoto');
		expect(image.prop('style')[0]).toMatchObject({ width: 15, height: 15 });
	});

	it("renders an online indicator", () => {
		const wrapper = shallow(<UserPhoto url={URI_IMAGE} online />);
		const onlineIndicator = wrapper.findWhere(n => n.prop('testId') === 'onlineIndicator');
		expect(wrapper).toMatchSnapshot();
		expect(onlineIndicator.exists()).toBeTruthy();
	});
		
	it("renders a positive online indicator", () => {
		const wrapper = shallow(<UserPhoto url={URI_IMAGE} online={true} />);
		const onlineIndicator = wrapper.findWhere(n => n.prop('testId') === 'onlineIndicator');
		expect(onlineIndicator.prop('style')[1]).toMatchObject({ backgroundColor: styleVars.positive });
	});

	it("renders a negative online indicator", () => {
		const wrapper = shallow(<UserPhoto url={URI_IMAGE} online={false} />);
		const onlineIndicator = wrapper.findWhere(n => n.prop('testId') === 'onlineIndicator');
		expect(onlineIndicator.prop('style')[1]).toMatchObject({ backgroundColor: styleVars.negative });
	});

	it("fades image when anonymous", () => {
		const wrapper = shallow(<UserPhoto url={URI_IMAGE} anon />);
		expect(wrapper).toMatchSnapshot();
	});
});
