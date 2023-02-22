import { Joystick } from 'react-joystick-component'

export interface JoystickMovement {
  isMoving: boolean
  direction: Direction
}

interface Direction {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
}

interface Props {
  onDirectionChange: (arg: JoystickMovement) => void
}

const angleToDirections = (angle: number): Direction => {
  let outObj: Direction = {
    left: false,
    right: false,
    up: false,
    down: false,
  }
  angle = (angle + 360) % 360

  if (angle > 22.5 && angle <= 67.5) {
    outObj.down = true
    outObj.right = true
  } else if (angle > 67.5 && angle <= 112.5) {
    outObj.down = true
  } else if (angle > 112.5 && angle <= 157.5) {
    outObj.down = true
    outObj.left = true
  } else if (angle > 157.5 && angle <= 202.5) {
    outObj.left = true
  } else if (angle > 202.5 && angle <= 247.5) {
    outObj.left = true
    outObj.up = true
  } else if (angle > 247.5 && angle <= 292.5) {
    outObj.up = true
  } else if (angle > 292.5 && angle <= 337.5) {
    outObj.up = true
    outObj.right = true
  } else {
    outObj.right = true
  }
  return outObj
}

const JoystickItem = (props: Props) => {
  return (
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
        const y1 = event.y ?? 0
        const x2 = event.x ?? 0
        const y2 = 0
        var deltaX = x2 - x1 // distance between joystick and center
        var deltaY = y2 - y1 // distance between joystick and center
        var rad = Math.atan2(deltaY, deltaX) // In radians
        var deg = (rad * 180) / Math.PI // In degrees
        var direction = angleToDirections(deg) // Convert degrees to direction
        props.onDirectionChange({ isMoving: true, direction })
      }}
    />
  )
}

export default JoystickItem
