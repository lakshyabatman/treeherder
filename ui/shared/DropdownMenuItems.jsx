import React from 'react';
import PropTypes from 'prop-types';
import { DropdownMenu, DropdownItem } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

const createDropdownItem = (item, namespace, updateData, selectedItem) => {
  return (
    <DropdownItem
      tag="a"
      key={`${namespace}${item}`}
      onClick={() => updateData(item)}
    >
      <FontAwesomeIcon
        icon={faCheck}
        className={`mr-1 ${selectedItem === item ? '' : 'hide'}`}
        title={selectedItem === item ? 'Selected' : ''}
      />
      {item}
    </DropdownItem>
  );
};

const DropdownMenuItems = ({
  selectedItem,
  updateData,
  options,
  pinned,
  namespace,
}) => (
  <DropdownMenu className="overflow-auto dropdown-menu-height">
    {/* Items pinned to top of dropdown */}
    {pinned.length > 0 && (
      <React.Fragment>
        {pinned.map((item) =>
          createDropdownItem(item, namespace, updateData, selectedItem),
        )}
        <DropdownItem divider />
      </React.Fragment>
    )}
    {options.map((item) =>
      createDropdownItem(item, namespace, updateData, selectedItem),
    )}
  </DropdownMenu>
);

DropdownMenuItems.propTypes = {
  updateData: PropTypes.func,
  selectedItem: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  pinned: PropTypes.arrayOf(PropTypes.string),
  namespace: PropTypes.string,
};

DropdownMenuItems.defaultProps = {
  updateData: null,
  selectedItem: null,
  pinned: [],
  namespace: '',
};

export default DropdownMenuItems;
