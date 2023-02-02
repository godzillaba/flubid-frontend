import { CircularProgress } from '@material-ui/core';
import React, { useEffect } from 'react';

import {execute, TestQueryDocument, TestQueryQuery} from "../graph/.graphclient";


export default function Explore() {
  const [data, setData] = React.useState<TestQueryQuery>();

  useEffect(() => {
    execute(TestQueryDocument, {a: 1}).then((result) => {
      setData(result?.data)
    })
  }, [setData])

  if (data) { 
    return (
      <h1>{JSON.stringify(data)}</h1>
    );
  }
  else {
    return (
      <CircularProgress />
    )
  }
}

