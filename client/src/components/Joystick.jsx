import { Joystick } from 'react-joystick-component'
import React from 'react'

var AngleToDirections = function (angle, out) {
  if (out === undefined) {
    out = {}
  } else if (out === true) {
    out = globOut
  }

  out.left = false
  out.right = false
  out.up = false
  out.down = false

  angle = (angle + 360) % 360

  if (angle > 22.5 && angle <= 67.5) {
    out.down = true
    out.right = true
  } else if (angle > 67.5 && angle <= 112.5) {
    out.down = true
  } else if (angle > 112.5 && angle <= 157.5) {
    out.down = true
    out.left = true
  } else if (angle > 157.5 && angle <= 202.5) {
    out.left = true
  } else if (angle > 202.5 && angle <= 247.5) {
    out.left = true
    out.up = true
  } else if (angle > 247.5 && angle <= 292.5) {
    out.up = true
  } else if (angle > 292.5 && angle <= 337.5) {
    out.up = true
    out.right = true
  } else {
    out.right = true
  }
  return out
}

var globOut = {}

function JoystickItem(props) {
  return (
    <>
      <Joystick
        size={75}
        baseColor="#4b4b4b70"
        stickColor="#42eacb80"
        stop={() => {
          props.onDirectionChange({
            isMoving: false,
            direction: {
              left: false,
              right: false,
              up: false,
              down: false,
            },
          })
        }}
        move={(event) => {
          const x1 = 0
          const y1 = event.y
          const x2 = event.x
          const y2 = 0
          var deltaX = x2 - x1 // distance between joystick and center
          var deltaY = y2 - y1 // distance between joystick and center
          var rad = Math.atan2(deltaY, deltaX) // In radians
          var deg = (rad * 180) / Math.PI // In degrees
          var direction = AngleToDirections(deg, true) // Convert degrees to direction
          props.onDirectionChange({ isMoving: true, direction: direction })
        }}
      />
    </>
  )
}

export default JoystickItem
