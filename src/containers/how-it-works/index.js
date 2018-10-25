import React from 'react'

import Button from '../../components/button'
import howItWorks from '../../assets/images/how-it-works.png'
import infographic from '../../assets/images/infographic.png'

import './how-it-works.css'

export default () => (
  <div className="HowItWorks">
    <h1 className="HowItWorks-title">Tokens on Trial</h1>
    <img src={howItWorks} alt="Token" className="HowItWorks-image" />
    <p className="HowItWorks-text">
      The Token List is Kleros' majestic curated list experiment.
      <br />
      <br />
      In Kleros, we have two sides to the party. The arbitrators that rule on
      disputes and the arbitrable parties (we like this word) that create the
      disputes in the first place.
      <br />
      <br />
      The Token List is a fun way of creating disputes to test our arbitrating
      technology.
      <br />
      <br />
      The rules of the game are simple. Anyone can submit images to the gallery
      by clicking on the "Submit Token" button on the top right.
      <br />
      <br />
      Anyone can challenge an image (say it's not a doge) for a period of time.
      Challenging it will create a Kleros dispute with the image as evidence for
      jurors to decide who is right.
      <br />
      <br />
      Both submitting and challenging images require an ETH deposit. This
      deposit is used to pay juror arbitration fees and any leftover amount is
      given to the winning party. So yeah, if you win, you win ETH.
      <br />
      <br />
      Both the submitter and the challenger can appeal the decision made by the
      jurors by paying the appeal fees.
      <br />
      <br />
      This infographic might make things clearer:
      <img
        src={infographic}
        alt="Flow Infographic"
        className="HowItWorks-text-infographic"
      />
      <br />
      <br />
      Enough reading now, go have some fun,
      <br />
      The Kleros Team
      <br />
      <br />
      <h2>Payout Policy</h2>
      The Tokens on Trial experiment runs on the Ethereum mainnet with real ETH
      in order to test how agents respond to economic incentives. Note these are
      policies that the Kleros Coop team uses for rewards, not subcourt
      policies.
      <br />
      <br />
      The payout policy of the experiment is defined as follows:
      <ul>
        <li>
          A total of 1,000,000 Token Coins (DOGE) will be split among submitters
          in proportion to the amount of unique doge pictures they get accepted
          into the list.
        </li>
        <br />
        <li>
          The first submitter to get a cat accepted into the list will be paid
          10 ETH.
        </li>
        <br />
        <li>
          One cryptokitty and 2 ETH will be paid for each of the 2-10th cats
          accepted into the list.
        </li>
        <br />
        <li>
          If there are no cats in the list at the end of the experiment, the
          submitters of the 10 cats that won the most dispute rounds will be
          paid 2 ETH each (a picture can win a dispute while not being accepted
          into the list if it is rechallenged within 1 day and loses). If the
          10th spot is a tie, the 2 ETH will be split evenly.
        </li>
        <br />
        <li>
          To be considered valid, a picture must clearly display a doge or a
          cat. Pictures with hidden doges or cats will not be considered as
          valid if a normal observer would not be able to see it without help
          (e.g., an image with a doge only a few px large would not be
          considered valid, because an observer would be unable to see it with
          plain sight).
        </li>
        <br />
        <li>
          If a picture is submitted multiple times, only the first one will be
          considered valid.
        </li>
        <br />
        <li>
          Pictures which are only a slight modification of a previously
          submitted picture will not be considered valid.
        </li>
        <br />
        <li>
          Pictures which contain both a doge and a cat will not be considered
          valid.
        </li>
        <br />
        <li>
          Coopérative Kleros' team will have the final decision on wether a
          picture is valid or not for the purpose of the payout.
        </li>
        <br />
        <li>
          Coopérative Kleros' team can decide, at its sole discretion, to change
          any parameter of the experiment to fulfill its research goals.
        </li>
        <br />
        <li>
          By participating in the Tokens on Trial experiment, you agree to all
          these conditions.
        </li>
        <br />
      </ul>
    </p>
    <Button to="https://medium.com/kleros/doges-on-trial-pilot-explainer-911492c3a7d8">
      Guide
    </Button>
  </div>
)
