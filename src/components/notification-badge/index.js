import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import TimeAgo from 'timeago-react'
import { connect } from 'react-redux'

import * as notificationSelectors from '../../reducers/notification'
import * as modalActions from '../../actions/modal'
import NavOverlay from '../../components/nav-overlay'

import './notification-badge.css'

class NotificationBadge extends PureComponent {
  static propTypes = {
    // State
    children: PropTypes.node.isRequired,
    notifications: notificationSelectors.notificationsShape.isRequired,
    maxShown: PropTypes.number,
    isNotificationsModalOpen: PropTypes.oneOf([true, false]).isRequired,

    // Handlers
    onShowAll: PropTypes.func,
    openNotificationsModal: PropTypes.func.isRequired,
    closeNotificationsModal: PropTypes.func.isRequired,
    onNotificationClick: PropTypes.func.isRequired
  }

  static defaultProps = {
    // State
    maxShown: null,

    // Handlers
    onShowAll: null
  }

  handleOpenNotificationClick = () => {
    const { openNotificationsModal, isNotificationsModalOpen } = this.props
    if (isNotificationsModalOpen) return // This method is triggered when clicking on the overlay so we avoid opening it again.
    openNotificationsModal()
  }

  handleOverlayClick = () => {
    const { closeNotificationsModal } = this.props
    closeNotificationsModal()
  }

  render() {
    const {
      children,
      notifications,
      maxShown,
      onShowAll,
      onNotificationClick,
      isNotificationsModalOpen
    } = this.props

    if (!notifications.data) return null

    const hasNotifications = notifications.data.length > 0
    const useMaxShown = maxShown && notifications.data.length > maxShown
    return (
      <div
        className="NotificationBadge"
        onClick={this.handleOpenNotificationClick}
      >
        {children}
        {hasNotifications && (
          <div className="NotificationBadge-badge">
            {notifications.data.length}
          </div>
        )}
        {hasNotifications && isNotificationsModalOpen && (
          <div>
            <NavOverlay onClick={this.handleOverlayClick} />
            <div className="NotificationBadge-notifications">
              {(useMaxShown
                ? notifications.data.slice(0, maxShown)
                : notifications.data
              ).map((n, i) => (
                <div
                  key={n.ID + i}
                  id={n.ID}
                  onClick={onNotificationClick}
                  className="NotificationBadge-notifications-notification"
                >
                  <div className="NotificationBadge-notifications-notification-content">
                    {n.message}
                    <br />
                    <small>
                      <TimeAgo datetime={n.date} />
                    </small>
                  </div>
                </div>
              ))}
              {useMaxShown && (
                <div
                  onClick={onShowAll}
                  className="NotificationBadge-notifications-showAll"
                >
                  <small>SHOW ALL</small>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default connect(
  state => ({
    isNotificationsModalOpen: state.modal.isNotificationsModalOpen
  }),
  {
    openNotificationsModal: modalActions.openNotificationsModal,
    closeNotificationsModal: modalActions.closeNotificationsModal
  }
)(NotificationBadge)
