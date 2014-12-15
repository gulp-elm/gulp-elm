module Test1 where

import Text(plainText)
import Graphics.Element(tag)

main = tag "hello" <| plainText "Test"
