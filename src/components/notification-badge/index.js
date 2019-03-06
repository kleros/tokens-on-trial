import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import TimeAgo from 'timeago-react'
import { connect } from 'react-redux'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as notificationSelectors from '../../reducers/notification'
import * as modalActions from '../../actions/modal'
import * as tcrConstants from '../../constants/tcr'
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

    const hasNotifications = notifications.data.length > 0
    const useMaxShown = false
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
              <h4 className="NotificationBadge-notifications-title">
                Notifications
              </h4>
              <hr style={{ margin: 0, marginBottom: '15px' }} />
              <div className="NotificationBadge-notifications-box">
                {(useMaxShown
                  ? notifications.data.slice(0, maxShown)
                  : notifications.data
                )
                  .sort((a, b) => b.date - a.date)
                  .map((n, i /* eslint-disable react/jsx-no-bind */) => (
                    <div
                      className="NotificationBadge-notifications-notification"
                      id={n.ID ? `${n.ID}${i}` : `${n.addr}${i}`}
                      key={n.ID ? `${n.ID}${i}` : `${n.addr}${i}`}
                      onClick={() =>
                        onNotificationClick({
                          ID: n.ID,
                          addr: n.addr,
                          badgeAddr: n.badgeAddr
                        })
                      }
                    >
                      {/* eslint-enable */}
                      <FontAwesomeIcon
                        className="NotificationBadge-notifications-notification-icon"
                        color={tcrConstants.STATUS_COLOR_ENUM[1]}
                        icon="exclamation-circle"
                        size="lg"
                      />
                      <div className="NotificationBadge-notifications-notification-content">
                        <div className="NotificationBadge-notifications-notification-content-message">
                          {n.message}
                        </div>
                        <div
                          className="NotificationBadge-notifications-notification-content-footer"
                          style={{
                            color: n.clientStatus
                              ? tcrConstants.STATUS_COLOR_ENUM[n.clientStatus]
                              : tcrConstants.STATUS_COLOR_ENUM[0]
                          }}
                        >
                          <TimeAgo datetime={n.date} />
                        </div>
                      </div>
                    </div>
                  ))}
                {useMaxShown &&
                false && ( // TODO: remove false flag once notifications view is implemented
                    <div
                      className="NotificationBadge-notifications-showAll"
                      onClick={onShowAll}
                    >
                      <div className="NotificationBadge-notifications-showAll-down" />
                    </div>
                  )}
              </div>
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
